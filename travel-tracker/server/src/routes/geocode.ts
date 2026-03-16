import { Router, Request, Response } from 'express'
import { reverseGeocode } from '../services/geocodeService'

const router = Router()

// GET /api/geocode?lat=&lng=
router.get('/', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string)
  const lng = parseFloat(req.query.lng as string)
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng required' })
    return
  }
  const result = await reverseGeocode(lat, lng)
  res.json(result)
})

export default router
