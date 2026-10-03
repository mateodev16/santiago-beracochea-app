import { one } from '../database.js'

export const insertImage = async ({ mime, data }) =>
  one(
    `insert into product_images (mime, size, data)
     values ($1, $2, $3)
     returning id, mime, size, created_at`,
    [mime, data.length, data],
  )

export const findImage = async (id) =>
  one(
    `select id, mime, size, data from product_images where id = $1`,
    [id],
  )