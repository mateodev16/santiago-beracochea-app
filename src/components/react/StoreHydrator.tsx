import { useEffect } from 'react'
import { bootstrap } from '../../lib/store'

export default function StoreHydrator() {
  useEffect(() => {
    bootstrap()
  }, [])

  return null
}