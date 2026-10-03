import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { requireAdmin } from '../middleware/auth.js'
import { findImage, insertImage } from '../repositories/images.js'
import { ApiError, asyncHandler } from '../utils/errors.js'
import {
  ALLOWED_IMAGE_TYPES,
  imageUrl,
  isImageId,
  sniffImageMime,
} from '../utils/images.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.imageMaxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Formato no admitido. Usá PNG, JPEG, WebP o AVIF.'))
    }
    cb(null, true)
  },
})

router.post(
  '/',
  requireAdmin,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Subí una imagen')

    const mime = sniffImageMime(req.file.buffer)
    if (!mime) throw ApiError.badRequest('El archivo no es una imagen válida.')

    const row = await insertImage({ mime, data: req.file.buffer })
    res.status(201).json({
      image: { id: row.id, url: imageUrl(row.id), mime, size: row.size },
    })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isImageId(req.params.id)) throw ApiError.notFound('Imagen no encontrada')
    const image = await findImage(req.params.id)
    if (!image) throw ApiError.notFound('Imagen no encontrada')

    res.setHeader('Content-Type', image.mime)
    res.setHeader('Content-Length', image.data.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.end(image.data)
  }),
)

export default router