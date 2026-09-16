/**
 * Genera los iconos de Lumen a partir de build/icon.svg.
 *
 *   npm run icons
 *
 * Se ejecuta DENTRO de Electron (no hace falta ninguna librería de rasterizado):
 * rasteriza el SVG a 1024×1024 con una BrowserWindow offscreen, escala con `sips`,
 * arma el .icns con `iconutil` (solo macOS) y escribe el .ico a mano (entradas PNG).
 *
 * Salidas:
 *   build/icon.png        1024×1024
 *   resources/icon.png    1024×1024
 *   build/icon.icns       iconset completo 16..1024 (@1x y @2x)
 *   build/icon.ico        16/32/48/64/128/256
 *   build/icon-preview.png  vista previa a 16/32/128/512 px sobre fondo claro y oscuro
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type -- script JS de build, sin TS */
import { app, BrowserWindow } from 'electron'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SVG = join(ROOT, 'build', 'icon.svg')
const OUT_PNG = join(ROOT, 'build', 'icon.png')
const OUT_RES_PNG = join(ROOT, 'resources', 'icon.png')
const OUT_ICNS = join(ROOT, 'build', 'icon.icns')
const OUT_ICO = join(ROOT, 'build', 'icon.ico')
const OUT_PREVIEW = join(ROOT, 'build', 'icon-preview.png')

const ICO_SIZES = [16, 32, 48, 64, 128, 256]
const ICNS_SET = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024]
]

// En pantallas Retina, capturePage devuelve píxeles físicos (2× los lógicos).
// Se mide el factor real con una captura de prueba y se compensa.
let SCALE = 1
let WORK = ''
let WIN = null
let htmlSeq = 0

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} falló (status ${r.status})`)
}

/** Rasteriza un HTML a `w`×`h` píxeles FÍSICOS con una ventana offscreen reutilizada. */
async function renderHtml(html, w, h) {
  const lw = Math.round(w / SCALE)
  const lh = Math.round(h / SCALE)
  if (!WIN) {
    WIN = new BrowserWindow({
      show: false,
      width: lw,
      height: lh,
      transparent: true,
      frame: false,
      useContentSize: true,
      webPreferences: { offscreen: true, backgroundThrottling: false }
    })
  } else {
    WIN.setContentSize(lw, lh)
  }
  const htmlPath = join(WORK, `page-${htmlSeq++}.html`)
  writeFileSync(htmlPath, html)
  await WIN.loadFile(htmlPath)
  // margen para que el compositor pinte (imágenes incluidas)
  await new Promise((r) => setTimeout(r, 250))
  return WIN.webContents.capturePage({ x: 0, y: 0, width: lw, height: lh })
}

/** Rasteriza a exactamente `w`×`h` píxeles físicos. */
async function renderPng(html, w, h) {
  const img = await renderHtml(html, w, h)
  const { width, height } = img.getSize()
  if (width !== w || height !== h) {
    throw new Error(`capturePage devolvió ${width}×${height}, se esperaba ${w}×${h}`)
  }
  return img.toPNG()
}

/** Mide el factor de escala (Retina = 2) con una captura de prueba. */
async function probeScale() {
  SCALE = 1
  const img = await renderHtml('<!doctype html><html><body style="margin:0"></body></html>', 64, 64)
  SCALE = img.getSize().width / 64
  if (!Number.isInteger(SCALE) || SCALE < 1) throw new Error(`Factor de escala raro: ${SCALE}`)
}

async function renderSvg(size) {
  const svgUrl = pathToFileURL(SVG).href
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;width:100vw;height:100vh;overflow:hidden}
    img{display:block;width:100vw;height:100vh}
  </style></head><body><img src="${svgUrl}"></body></html>`
  return renderPng(html, size, size)
}

function resize(srcPng, size, outPath) {
  run('sips', ['-z', String(size), String(size), srcPng, '--out', outPath])
}

/** ICO con entradas PNG (soportado desde Windows Vista). */
function writeIco(pngByPath, outPath) {
  const entries = ICO_SIZES.map((s) => ({ size: s, data: readFileSync(pngByPath(s)) }))
  const headerLen = 6 + 16 * entries.length
  const header = Buffer.alloc(headerLen)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  let offset = headerLen
  entries.forEach((e, i) => {
    const o = 6 + i * 16
    header.writeUInt8(e.size >= 256 ? 0 : e.size, o) // 0 = 256
    header.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1)
    header.writeUInt8(0, o + 2) // palette
    header.writeUInt8(0, o + 3) // reserved
    header.writeUInt16LE(1, o + 4) // planes
    header.writeUInt16LE(32, o + 6) // bpp
    header.writeUInt32LE(e.data.length, o + 8)
    header.writeUInt32LE(offset, o + 12)
    offset += e.data.length
  })
  writeFileSync(outPath, Buffer.concat([header, ...entries.map((e) => e.data)]))
}

async function makePreview(pngByPath) {
  const img = (size, zoom) =>
    `<img src="${pathToFileURL(pngByPath(size)).href}" style="width:${(size * zoom) / SCALE}px;height:${(size * zoom) / SCALE}px">`
  const cell = (size, zoom = 1) =>
    `<div class="cell">${img(size, zoom)}<span>${size}${zoom > 1 ? ` ×${zoom}` : ''}</span></div>`
  const cells = () => [cell(512), cell(128), cell(32), cell(16), cell(32, 4), cell(16, 8)].join('')
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;background:#ffffff;font:12px -apple-system,Helvetica,Arial;color:#666;overflow:hidden}
    ::-webkit-scrollbar{display:none}
    .row{display:flex;align-items:flex-end;gap:20px;padding:16px 20px;box-sizing:border-box;width:${1200 / SCALE}px}
    .row.light{background:#f2f2f4;height:${600 / SCALE}px}
    .row.dark{background:#1c1c1e;color:#bbb;height:${600 / SCALE}px}
    .cell{display:flex;flex-direction:column;align-items:center;gap:8px}
    img{image-rendering:pixelated;display:block}
  </style></head><body>
    <div class="row light">${cells()}</div>
    <div class="row dark">${cells()}</div>
  </body></html>`
  writeFileSync(OUT_PREVIEW, (await renderHtml(html, 1200, 1200)).toPNG())
}

async function main() {
  if (!existsSync(SVG)) throw new Error(`No existe ${SVG}`)
  const work = join(tmpdir(), `lumen-icons-${process.pid}`)
  const iconset = join(work, 'icon.iconset')
  mkdirSync(iconset, { recursive: true })
  WORK = work
  await probeScale()
  console.log(`✓ factor de escala de pantalla: ${SCALE}×`)

  // 1) Master 1024
  const master = join(work, 'icon-1024.png')
  writeFileSync(master, await renderSvg(1024))
  console.log('✓ master 1024×1024')

  // 2) Escalas
  const pngFor = (s) => join(work, `icon-${s}.png`)
  const wanted = new Set([...ICO_SIZES, ...ICNS_SET.map(([, s]) => s), 16, 32, 128, 512])
  for (const s of [...wanted].sort((a, b) => a - b)) {
    if (s === 1024) continue
    resize(master, s, pngFor(s))
  }
  console.log('✓ escalas', [...wanted].sort((a, b) => a - b).join('/'))

  // 3) PNG principales
  writeFileSync(OUT_PNG, readFileSync(master))
  writeFileSync(OUT_RES_PNG, readFileSync(master))
  console.log('✓ build/icon.png y resources/icon.png (1024)')

  // 4) ICNS (macOS)
  if (process.platform === 'darwin') {
    for (const [name, s] of ICNS_SET) {
      writeFileSync(join(iconset, name), readFileSync(pngFor(s)))
    }
    run('iconutil', ['-c', 'icns', iconset, '-o', OUT_ICNS])
    console.log('✓ build/icon.icns')
  } else {
    console.warn('⚠ iconutil solo existe en macOS; build/icon.icns no se regeneró')
  }

  // 5) ICO
  writeIco(pngFor, OUT_ICO)
  console.log('✓ build/icon.ico', ICO_SIZES.join('/'))

  // 6) Vista previa
  await makePreview(pngFor)
  console.log('✓ build/icon-preview.png')

  if (WIN) WIN.destroy()
  rmSync(work, { recursive: true, force: true })
}

app
  .whenReady()
  .then(main)
  .then(
    () => app.exit(0),
    (err) => {
      console.error(err)
      app.exit(1)
    }
  )
