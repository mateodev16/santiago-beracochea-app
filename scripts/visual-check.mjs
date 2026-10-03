import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:4321'
const OUT = 'C:/Users/Mateo/AppData/Local/Temp/opencode/shots'
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['home', '/', true],
  ['catalogo', '/catalogo', true],
  ['producto', '/producto/cafe-molido-natural-1kg', true],
  ['login', '/login', false],
  ['registro', '/registro', false],
]
const WIDTHS = [1280, 1024, 900, 768, 390]

const browser = await chromium.launch()
let problems = 0

for (const width of WIDTHS) {
  console.log(`\n=== ${width}px ===`)
  for (const [name, path, expectChrome] of PAGES) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errs = []
    page.on('console', (m) => {
      const t = m.text()
      if (m.type() === 'error' && !t.includes('401')) errs.push(t.slice(0, 200))
    })
    page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 200)))

    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(1200)

    const info = await page.evaluate(() => {
      const vis = (el) => {
        if (!el) return false
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      }
      const navs = [...document.querySelectorAll('header nav')]
      const navLinks = navs.flatMap((n) =>
        [...n.querySelectorAll('a')].map((a) => ({
          text: a.textContent.trim(),
          shown: vis(a),
        })),
      )
      return {
        header: vis(document.querySelector('header')),
        main: vis(document.querySelector('main')),
        anyNavVisible: navs.some(vis),
        navLinks,
        sections: document.querySelectorAll('section').length,
        footer: vis(document.querySelector('footer')),
        productCards: document.querySelectorAll('main article').length,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
      }
    })

    const chromeOk = expectChrome ? info.header && info.footer : !info.header
    const bad = !info.main || !info.anyNavVisible === expectChrome || info.overflowX || errs.length > 0
    if (bad) problems++
    console.log(
      `  ${bad ? 'FALLA' : 'ok   '} ${name.padEnd(9)} main=${info.main} header=${info.header}(esperado=${expectChrome}) nav=${info.anyNavVisible} footer=${info.footer} secciones=${info.sections} cards=${info.productCards}`,
    )
    if (info.overflowX) console.log(`         DESBORDE-X ${info.scrollW} > ${info.innerW}`)
    const shown = info.navLinks.filter((l) => l.shown).map((l) => l.text)
    const hidden = info.navLinks.filter((l) => !l.shown).map((l) => l.text)
    console.log(`         nav visibles: ${shown.join(', ') || '(ninguno)'}${hidden.length ? ` | ocultos: ${hidden.length}` : ''}`)
    for (const e of [...new Set(errs)].slice(0, 3)) console.log(`         ERROR: ${e}`)

    if (width === 1280 || width === 900) await page.screenshot({ path: `${OUT}/${width}-${name}.png` })
    await page.close()
  }
}

await browser.close()
console.log(`\n=== problemas: ${problems} ===`)