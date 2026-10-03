import crypto from 'node:crypto'

export const uid = () => crypto.randomUUID()

export const orderCode = () => `SB-${Math.floor(Math.random() * 9000) + 1000}`

export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
