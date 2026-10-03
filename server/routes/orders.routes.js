import { Router } from 'express'
import { config } from '../config.js'
import { findOrder, insertOrder, listOrders, orderMetrics, updateOrderStatus } from '../repositories/orders.js'
import { findProduct } from '../repositories/products.js'
import { publicUser, requireAdmin, requireAuth } from '../middleware/auth.js'
import { ApiError, asyncHandler } from '../utils/errors.js'
import { orderSchema, orderStatusSchema } from '../validation.js'
import { orderCode } from '../utils/ids.js'

const router = Router()

const computeTotals = (items) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0)
  const shipping =
    subtotal === 0 || subtotal >= config.freeShippingThreshold ? 0 : config.shippingCost
  return { subtotal, shipping, total: subtotal + shipping }
}

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = orderSchema.parse(req.body)

    const items = []
    for (const item of input.items) {
      const product = await findProduct(item.productId)
      if (!product) throw ApiError.badRequest(`El producto ${item.productId} no existe`)
      if (product.stock < item.qty) {
        throw ApiError.badRequest(`Stock insuficiente para ${product.name}`)
      }
      items.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        qty: item.qty,
      })
    }

    const { subtotal, shipping, total } = computeTotals(items)

    const order = await insertOrder(
      {
        code: orderCode(),
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        subtotal,
        shipping,
        total,
        status: 'pendiente',
        date: new Date().toLocaleDateString('es-UY'),
        createdAt: new Date().toISOString(),
        address: input.address,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
      },
      items,
    )

    res.status(201).json({ order })
  }),
)

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin'
    const status = String(req.query.status ?? '')

    const orders = await listOrders({
      userId: isAdmin ? undefined : req.user.id,
      status: status || undefined,
    })

    res.json({ items: orders, total: orders.length })
  }),
)

router.get(
  '/summary/metrics',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const metrics = await orderMetrics()
    res.json({ ...metrics, admin: publicUser(req.user).email })
  }),
)

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await findOrder(req.params.id)
    if (!order) throw ApiError.notFound('Pedido no encontrado')
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      throw ApiError.forbidden('No podés ver este pedido')
    }
    res.json({ order })
  }),
)

router.patch(
  '/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = orderStatusSchema.parse(req.body)
    const order = await updateOrderStatus(req.params.id, status)
    if (!order) throw ApiError.notFound('Pedido no encontrado')
    res.json({ order })
  }),
)

export default router
