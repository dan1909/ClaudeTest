import express from 'express'
import cors from 'cors'
import path from 'path'
import tripsRouter from './routes/trips'
import stopsRouter from './routes/stops'
import { tripImagesRouter, imageOpsRouter } from './routes/images'
import geocodeRouter from './routes/geocode'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true }))
app.use(express.json())

// Static thumbnails
const THUMBNAILS_DIR = path.resolve(process.cwd(), '../../thumbnails')
app.use('/thumbnails', express.static(THUMBNAILS_DIR))

// API routes
app.use('/api/trips', tripsRouter)           // trip CRUD + stop reorder
app.use('/api/trips', tripImagesRouter)      // trip image upload/list + build (/:tripId/images, /:tripId/build)
app.use('/api/stops', stopsRouter)           // stop CRUD
app.use('/api/images', imageOpsRouter)       // standalone image operations (delete by ID)
app.use('/api/geocode', geocodeRouter)       // reverse geocoding

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

