import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/db'

const router = Router()

// GET /api/trips
router.get('/', (req: Request, res: Response) => {
  const trips = db.prepare(`
    SELECT t.*,
      COUNT(DISTINCT s.id) as stopCount,
      COUNT(DISTINCT i.id) as imageCount
    FROM trips t
    LEFT JOIN stops s ON s.tripId = t.id
    LEFT JOIN images i ON i.tripId = t.id
    GROUP BY t.id
    ORDER BY t.createdAt DESC
  `).all()
  res.json(trips)
})

// POST /api/trips
router.post('/', (req: Request, res: Response) => {
  const { name, description = '' } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const id = uuidv4()
  db.prepare('INSERT INTO trips (id, name, description) VALUES (?, ?, ?)').run(id, name, description)
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id)
  res.status(201).json(trip)
})

// GET /api/trips/:id
router.get('/:id', (req: Request, res: Response) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id)
  if (!trip) {
    res.status(404).json({ error: 'not found' })
    return
  }
  const stops = db.prepare('SELECT * FROM stops WHERE tripId = ? ORDER BY orderIndex').all(req.params.id)
  const images = db.prepare('SELECT * FROM images WHERE tripId = ?').all(req.params.id)
  res.json({ trip, stops, images })
})

// PUT /api/trips/:id
router.put('/:id', (req: Request, res: Response) => {
  const { name, description } = req.body
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id)
  if (!trip) {
    res.status(404).json({ error: 'not found' })
    return
  }
  db.prepare('UPDATE trips SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
    .run(name ?? null, description ?? null, req.params.id)
  res.json(db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id))
})

// DELETE /api/trips/:id
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// PATCH /api/trips/:id/stops/reorder
router.patch('/:id/stops/reorder', (req: Request, res: Response) => {
  const { stopIds } = req.body as { stopIds: string[] }
  if (!Array.isArray(stopIds)) {
    res.status(400).json({ error: 'stopIds must be an array' })
    return
  }
  const update = db.prepare('UPDATE stops SET orderIndex = ? WHERE id = ? AND tripId = ?')
  const reorder = db.transaction(() => {
    stopIds.forEach((id, idx) => update.run(idx, id, req.params.id))
  })
  reorder()
  res.json({ ok: true })
})

export default router
