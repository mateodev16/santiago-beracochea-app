import { Router } from 'express'
import {
  countProducts,
  deleteProduct,
  findProduct,
  insertProduct,
  listCategories,
  listProducts,
  updateProduct,
} from '../repositories/products.js'
import { requireAdmin } from '../middleware/auth.js'
import { ApiError, asyncHandler } from '../utils/errors.js'
import { productQuerySchema, productSchema, productUpdateSchema } from '../validation.js'
import { uid } from '../utils/ids.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query)
    const total = await countProducts(query)
    const items = await listProducts(query)

    res.json({
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(Math.ceil(total / query.limit), 1),
    })
  }),
)

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listCategories() })
  }),
)

router.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const product = await findProduct(req.params.idOrSlug)
    if (!product) throw ApiError.notFound('Producto no encontrado')
    res.json({ product })
  }),
)

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = productSchema.parse(req.body)
    const product = await insertProduct({ ...input, id: uid() })
    res.status(201).json({ product })
  }),
)

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = productUpdateSchema.parse(req.body)
    const product = await updateProduct(req.params.id, input)
    res.json({ product })
  }),
)

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await deleteProduct(req.params.id)
    res.json({ product })
  }),
)

export default router
