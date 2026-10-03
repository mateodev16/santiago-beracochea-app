import { chromium } from 'playwright'

const BASE = 'http://localhost:4321'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('401')) errs.push(m.text().slice(0, 160))
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// 1. Las 7 tarjetas de categoría y su filtrado real
const hrefs = await page.locator('a[href*="/catalogo?categoria="]').evaluateAll((els) =>
  els.map((e) => e.getAttribute('href')),
)
console.log(`tarjetas de categoria en /: ${hrefs.length}\n`)

for (const href of hrefs) {
  const label = decodeURIComponent(href.replace('/catalogo?categoria=', ''))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator(`a[href="${href}"]`).first().click()
  await page.waitForURL(/\/catalogo\?categoria=/, { timeout: 15000 })
  await page.waitForTimeout(1200)

  const shown = await page.locator('main article h3').allTextContents()
  const checked = await page.locator('input[type=checkbox]:checked').allTextContents()
  const total = await page.locator('main article').count()
  console.log(
    `  ${label.padEnd(12)} mostrados=${total} chips=[${checked.join(',')}] productos=[${shown.join(' | ').slice(0, 60)}]`,
  )
}

// 2. Anclas del nav
for (const [label, expectHash, expectSel] of [
  ['Marcas', '#marcas', '#marcas'],
  ['Contacto', '#contacto', '#contacto'],
]) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.locator(`header nav a:has-text("${label}")`).first().click()
  await page.waitForTimeout(1000)
  const hash = new URL(page.url()).hash
  const ok = await page.locator(expectSel).count()
  console.log(`  nav ${label}: hash=${hash} destinoExiste=${ok > 0}`)
}

// 3. Carrito
await page.goto(BASE + '/catalogo', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.locator('button[aria-label="Abrir carrito"]').click()
await page.waitForTimeout(700)
const cart = await page.locator('[role=dialog], .fixed').count()
console.log(`  carrito abre: ${cart > 0 ? 'si' : 'NO'}`)

// 4. Login con next
await page.goto(BASE + '/pedidos', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
console.log(`  /pedidos anonimo redirige a: ${new URL(page.url()).pathname}${new URL(page.url()).search}`)

console.log(`\nerrores de pagina: ${errs.length}`)
for (const e of [...new Set(errs)].slice(0, 5)) console.log('  ' + e)
await browser.close()