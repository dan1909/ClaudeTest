import { Router, Request, Response } from 'express'
import db from '../db/db'

const router = Router()

// PUT /api/stops/:id
router.put('/:id', (req: Request, res: Response) => {
  const stop = db.prepare('SELECT * FROM stops WHERE id = ?').get(req.params.id)
  if (!stop) {
    res.status(404).json({ error: 'not found' })
    return
  }
  const { name, type, lat, lng, address, arrivalDate, departureDate, notes } = req.body
  db.prepare(`
    UPDATE stops SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      address = COALESCE(?, address),
      arrivalDate = COALESCE(?, arrivalDate),
      departureDate = COALESCE(?, departureDate),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(
    name ?? null,
    type ?? null,
    lat ?? null,
    lng ?? null,
    address ?? null,
    arrivalDate ?? null,
    departureDate ?? null,
    notes ?? null,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM stops WHERE id = ?').get(req.params.id))
})

// DELETE /api/stops/:id
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM stops WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
