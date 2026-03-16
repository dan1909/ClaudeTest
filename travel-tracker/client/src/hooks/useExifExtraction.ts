import { useState, useCallback } from 'react'
import exifr from 'exifr'
import { ExifData } from '../types'

export interface FileWithExif {
  file: File
  exif: ExifData | null
  preview: string
  status: 'gps' | 'date-only' | 'none'
}

export function useExifExtraction() {
  const [files, setFiles] = useState<FileWithExif[]>([])
  const [loading, setLoading] = useState(false)

  const extractExif = useCallback(async (newFiles: File[]) => {
    setLoading(true)
    const results: FileWithExif[] = await Promise.all(
      newFiles.map(async (file) => {
        const preview = URL.createObjectURL(file)
        try {
          const data = await exifr.parse(file, {
            gps: true,
            exif: true,
            translateKeys: true,
            translateValues: true,
            reviveValues: true,
          })
          if (!data) {
            return { file, exif: null, preview, status: 'none' as const }
          }
          const lat = data.latitude || data.GPSLatitude
          const lng = data.longitude || data.GPSLongitude
          const takenAt = data.DateTimeOriginal || data.CreateDate
          const exif: ExifData = {
            lat: typeof lat === 'number' ? lat : undefined,
            lng: typeof lng === 'number' ? lng : undefined,
            takenAt: takenAt instanceof Date ? takenAt : undefined,
            make: data.Make,
            model: data.Model,
            width: data.ExifImageWidth || data.ImageWidth,
            height: data.ExifImageHeight || data.ImageHeight,
          }
          const hasGps = exif.lat != null && exif.lng != null
          const hasDate = exif.takenAt != null
          return {
            file,
            exif,
            preview,
            status: hasGps ? 'gps' : hasDate ? 'date-only' : 'none',
          } as FileWithExif
        } catch {
          return { file, exif: null, preview, status: 'none' as const }
        }
      })
    )
    setFiles((prev) => [...prev, ...results])
    setLoading(false)
    return results
  }, [])

  const clearFiles = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
  }, [files])

  return { files, loading, extractExif, clearFiles }
}
