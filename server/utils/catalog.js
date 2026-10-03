import fs from 'node:fs'
import { config } from '../config.js'

export const readCatalog = () => {
  const raw = fs.readFileSync(config.catalogFile, 'utf8')
  return JSON.parse(raw)
}
