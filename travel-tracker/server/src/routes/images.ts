import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import db from '../db/db'
import { generateThumbnail, computeSha256, UPLOADS_DIR } from '../services/imageService'
import { buildTrip } from '../services/tripBuilderService'

// Router for trip-scoped image operations: mounted at /api/trips
export const tripImagesRouter = Router()

// Router for standalone image operations: mounted at /api/images
export const imageOpsRouter = Router()

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpe?g|png|heic|heif|tiff?)$/i
    cb(null, allowed.test(file.originalname))
  },
})

// POST /api/trips/:tripId/images
tripImagesRouter.post('/:tripId/images', upload.array('images', 50), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'no files' })
    return
  }

  const trip = db.prepare('SELECT id FROM trips WHERE id = ?').get(req.params.tripId)
  if (!trip) {
    res.status(404).json({ error: 'trip not found' })
    return
  }

  // Parse EXIF data array sent from client
  let exifArray: Array<{
    lat: number | null; lng: number | null; takenAt: string | null;
    cameraMake: string | null; cameraModel: string | null;
    width: number | null; height: number | null;
  }> = []
  try {
    if (req.body.exif) exifArray = JSON.parse(req.body.exif)
  } catch {}

  const results = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const exif = exifArray[i] || {}

    // Dedup check using first 64KB hash
    const buf = fs.readFileSync(file.path)
    const sha = computeSha256(buf)
    const existing = db.prepare('SELECT id FROM images WHERE tripId = ? AND sha256 = ?').get(req.params.tripId, sha)
    if (existing) {
      fs.unlinkSync(file.path)
      continue
    }

    let thumbnailFilename: string | null = null
    try {
      thumbnailFilename = await generateThumbnail(file.filename)
    } catch (err) {
      console.error('Thumbnail error:', err)
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO images (id, tripId, filename, storedFilename, thumbnailFilename, lat, lng, takenAt,
        cameraMake, cameraModel, width, height, fileSize, sha256)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.params.tripId, file.originalname, file.filename, thumbnailFilename,
      exif.lat ?? null, exif.lng ?? null, exif.takenAt ?? null,
      exif.cameraMake ?? null, exif.cameraModel ?? null,
      exif.width ?? null, exif.height ?? null,
      file.size, sha
    )

    results.push(db.prepare('SELECT * FROM images WHERE id = ?').get(id))
  }

  res.status(201).json(results)
})

// GET /api/trips/:tripId/images
tripImagesRouter.get('/:tripId/images', (req: Request, res: Response) => {
  const images = db.prepare('SELECT * FROM images WHERE tripId = ? ORDER BY takenAt ASC').all(req.params.tripId)
  res.json(images)
})

// POST /api/trips/:tripId/build
tripImagesRouter.post('/:tripId/build', async (req: Request, res: Response) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ?').get(req.params.tripId)
  if (!trip) {
    res.status(404).json({ error: 'trip not found' })
    return
  }
  try {
    const stops = await buildTrip(req.params.tripId, req.body)
    res.json(stops)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
})

// DELETE /api/images/:id
imageOpsRouter.delete('/:id', (req: Request, res: Response) => {
  const img = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id) as {
    storedFilename: string
    thumbnailFilename: string | null
  } | undefined

  if (!img) {
    res.status(404).json({ error: 'not found' })
    return
  }

  const uploadsDir = path.resolve(process.cwd(), '../../uploads')
  const thumbsDir = path.resolve(process.cwd(), '../../thumbnails')
  try { fs.unlinkSync(path.join(uploadsDir, img.storedFilename)) } catch {}
  if (img.thumbnailFilename) {
    try { fs.unlinkSync(path.join(thumbsDir, img.thumbnailFilename)) } catch {}
  }
  db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id)
  res.status(204).send()
})
