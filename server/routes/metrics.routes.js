import { Router } from 'express'
import { getMetrics } from '../repositories/metrics.js'
import { publicUser, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/errors.js'

const router = Router()

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const metrics = await getMetrics()
    res.json({ metrics, admin: publicUser(req.user).email })
  }),
)

export default router
