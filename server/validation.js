import { z } from 'zod'

export const emailField = z.string().trim().toLowerCase().email('Email inválido')

export const passwordField = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre completo'),
  email: emailField,
  password: passwordField,
  phone: z.string().trim().max(30).optional().default(''),
  city: z.string().trim().max(60).optional().default(''),
  address: z.string().trim().max(160).optional().default(''),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá tu nombre completo').optional(),
    phone: z.string().trim().max(30).optional(),
    city: z.string().trim().max(60).optional(),
    address: z.string().trim().max(160).optional(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No enviaste ningún campo para actualizar',
  })

export const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  brand: z.string().trim().min(1, 'La marca es obligatoria'),
  category: z.string().trim().min(1, 'La categoría es obligatoria'),
  description: z.string().trim().max(600).optional().default(''),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  unit: z.string().trim().min(1, 'La presentación es obligatoria').optional().default('unidad'),
  image: z.string().trim().min(1, 'La imagen es obligatoria'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').optional().default(0),
  badge: z.string().trim().max(24).optional(),
  slug: z.string().trim().optional(),
})

export const productUpdateSchema = productSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No enviaste ningún campo para actualizar' },
)

export const orderItemSchema = z.object({
  productId: z.string().trim().min(1, 'Producto inválido'),
  qty: z.coerce.number().int().min(1, 'La cantidad mínima es 1').max(99, 'Máximo 99 por producto'),
})

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'El pedido está vacío'),
  address: z.string().trim().min(4, 'Ingresá la dirección de entrega'),
  notes: z.string().trim().max(400).optional().default(''),
  paymentMethod: z
    .enum(['transferencia', 'efectivo', 'credito'], { errorMap: () => ({ message: 'Método de pago inválido' }) })
    .default('transferencia'),
})

export const orderStatusSchema = z.object({
  status: z.enum(['pendiente', 'confirmado', 'entregado'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
})

export const productQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  brand: z.string().trim().optional().default(''),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  sort: z.enum(['relevancia', 'precio-asc', 'precio-desc', 'nombre']).optional().default('relevancia'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(24),
})

export const parseList = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)