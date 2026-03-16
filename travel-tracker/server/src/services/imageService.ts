import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const UPLOADS_DIR = path.resolve(process.cwd(), '../../uploads')
const THUMBNAILS_DIR = path.resolve(process.cwd(), '../../thumbnails')

fs.mkdirSync(UPLOADS_DIR, { recursive: true })
fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })

export { UPLOADS_DIR, THUMBNAILS_DIR }

export async function generateThumbnail(storedFilename: string): Promise<string> {
  const inputPath = path.join(UPLOADS_DIR, storedFilename)
  const thumbName = `thumb_${storedFilename.replace(/\.[^.]+$/, '.jpg')}`
  const outputPath = path.join(THUMBNAILS_DIR, thumbName)

  if (fs.existsSync(outputPath)) return thumbName

  await sharp(inputPath)
    .rotate() // auto-rotate based on EXIF orientation
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(outputPath)

  return thumbName
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer.slice(0, 65536)).digest('hex')
}
