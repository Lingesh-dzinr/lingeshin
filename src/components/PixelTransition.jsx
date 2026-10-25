import { useEffect, useRef } from 'react'
import token from '../lib/token'

// Port of the Framer code component PixelScrollTransition ("colors" reveal mode).
// Threshold/pattern/phase maths are copied 1:1; cells are painted on a canvas
// instead of one <div> per pixel, and the framer-motion spring is a small rAF spring.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function applyEasing(v, easing) {
  const t = clamp(v, 0, 1)
  if (easing === 'ease-in') return t * t * t
  if (easing === 'ease-out') return 1 - Math.pow(1 - t, 3)
  if (easing === 'ease-in-out') return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  if (easing === 'expo-out') return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  return t
}

function baseThreshold(row, col, rows, columns, direction) {
  const rowNorm = rows <= 1 ? 0.5 : row / (rows - 1)
  const colNorm = columns <= 1 ? 0.5 : col / (columns - 1)
  if (direction === 'top-bottom') return rowNorm
  if (direction === 'bottom-top') return 1 - rowNorm
  if (direction === 'left-right') return colNorm
  if (direction === 'right-left') return 1 - colNorm
  const dx = colNorm - 0.5, dy = rowNorm - 0.5
  const d = clamp(Math.sqrt(dx * dx + dy * dy) / Math.SQRT1_2, 0, 1)
  return direction === 'center-out' ? d : 1 - d
}

function patternShift(row, col, rows, columns, pattern, rand) {
  if (pattern === 'random') return (rand() - 0.5) * 1.6
  const rowNorm = rows <= 1 ? 0.5 : row / (rows - 1)
  const colNorm = columns <= 1 ? 0.5 : col / (columns - 1)
  if (pattern === 'checker') return (row + col) % 2 === 0 ? -0.2 : 0.2
  if (pattern === 'diagonal') return ((rowNorm + colNorm) * 0.5 - 0.5) * 0.75
  if (pattern === 'wave') return Math.sin(colNorm * Math.PI * 3 + rowNorm * Math.PI * 1.4) * 0.24
  const dx = colNorm - 0.5, dy = rowNorm - 0.5
  const radial = Math.sqrt(dx * dx + dy * dy) / Math.SQRT1_2
  if (pattern === 'radial') return (radial - 0.5) * 0.8
  const angle = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)
  return (((angle + radial * 1.15) % 1) - 0.5) * 0.6
}

function buildPixels(width, height, pixelSize, gap, direction, pattern, seed, jitter, accentShare) {
  const size = clamp(pixelSize, 2, 240), g = Math.max(0, gap)
  const columns = Math.max(1, Math.ceil((Math.max(1, width) + g) / (size + g)))
  const rows = Math.max(1, Math.ceil((Math.max(1, height) + g) / (size + g)))
  const rand = mulberry32(Math.floor(seed) + Math.floor(width) * 13 + Math.floor(height) * 29 + rows * 43 + columns * 59)
  const j = clamp(jitter, 0, 1), share = clamp(accentShare, 0, 0.6)
  const cells = []
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const base = baseThreshold(row, col, rows, columns, direction)
    const shift = patternShift(row, col, rows, columns, pattern, rand)
    const noise = (rand() - 0.5) * j * 0.65
    cells.push({
      left: col * (size + g), top: row * (size + g), size,
      threshold: clamp(base + shift * 0.5 + noise, 0, 1),
      accent: rand() < share,
      accentIndex: Math.floor(rand() * 4),
    })
  }
  return cells
}

function phase(p, progress, feather) {
  const edge = clamp(feather, 0.001, 0.35), delta = progress - p.threshold
  if (delta <= -edge) return 'from'
  if (delta >= edge) return 'to'
  if (!p.accent) return delta >= 0 ? 'to' : 'from'
  return 'accent'
}

export default function PixelTransition({
  from, to, accents, pixelSize = 18, gap = 0, endAt = 1, direction = 'bottom-top', pattern = 'radial',
  easing = 'linear', jitter = 0.28, feather = 0.07, smoothing = 0.4, seed = 13, accentShare = 0.16,
  band = 0.12, // width of the textured edge (0 = Framer's original single-style flip)
}) {
  const ref = useRef(null)
  const accentKey = accents.join()

  useEffect(() => {
    const c = ref.current, x = c.getContext('2d')
    // Colors may be tokens like "var(--color-orange)"; canvas needs the resolved value.
    const F = token(from), T = token(to), A = accents.map(token)
    const sm = clamp(smoothing, 0, 1)
    const k = 320 - sm * 240, d = 22 + sm * 22, m = 0.25 + sm * 0.6
    let pixels = [], w = 1, h = 1, dpr = 1, raf = 0, last = 0, pos, vel = 0, drawn = -1, tex = []

    // Textured pixel styles in the "to" colour, from sparse to dense: dots → diagonal hatch → checker.
    // Built in device pixels so they stay crisp at any zoom.
    const tile = (n, paint) => { const t = document.createElement('canvas'); t.width = t.height = n; const g = t.getContext('2d'); g.fillStyle = T; paint(g, n); return x.createPattern(t, 'repeat') }
    const buildTex = () => {
      const u = Math.max(1, Math.round(dpr * 1.5))
      tex = [
        tile(u * 4, (g, n) => g.fillRect(0, 0, u, u)),                                       // dots
        tile(u * 4, (g, n) => { for (let i = 0; i < n; i += u) g.fillRect(i, i, u, u); g.fillRect(n - u, 0, u, u) }), // hatch
        tile(u * 2, (g, n) => { g.fillRect(0, 0, u, u); g.fillRect(u, u, u, u) }),            // checker
      ]
    }

    // scroll offset ["start end", "end start"]
    const target = () => { const b = c.getBoundingClientRect(); return clamp((innerHeight - b.top) / (innerHeight + b.height), 0, 1) }

    // Each pixel remembers what it last showed; a frame only repaints pixels whose state changed.
    // State: 0 from (transparent, CSS background shows) · 1-3 textures · 4 to · 5+ accent colour.
    let state = new Int8Array(0)
    const draw = value => {
      const progress = applyEasing(clamp(value / clamp(endAt, 0.05, 1), 0, 1), easing)
      if (progress === drawn) return
      drawn = progress
      const edge = clamp(feather, 0.001, 0.35)
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i]
        const ph = phase(p, progress, feather)
        let code = ph === 'accent' ? 5 + (p.accentIndex % A.length) : ph === 'to' ? 4 : 0
        if (ph !== 'accent' && band > 0) {
          // Position inside the textured edge, nudged per pixel so the steps don't form straight bands.
          const q = (progress - p.threshold + edge + band) / (2 * (edge + band)) + (p.texNudge - 0.5) * 0.25
          code = clamp(Math.floor(q * 5), 0, 4)                // 0 from · 1 dots · 2 hatch · 3 checker · 4 solid
        }
        if (state[i] === code) continue
        state[i] = code
        x.clearRect(p.l, p.t, p.w, p.h)
        if (!code) continue
        x.fillStyle = code === 4 ? T : code > 4 ? A[code - 5] : tex[code - 1]
        x.fillRect(p.l, p.t, p.w, p.h)
      }
    }

    // Spring towards the scroll position (Framer's smoothing), only while on screen.
    const tick = t => {
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
      last = t
      const goal = target()
      vel += ((-k * (pos - goal) - d * vel) / m) * dt
      pos += vel * dt
      if (!visible || (Math.abs(pos - goal) < 1e-4 && Math.abs(vel) < 1e-4)) { pos = goal; vel = 0; raf = 0; last = 0 }
      else raf = requestAnimationFrame(tick)
      draw(pos)
    }
    let visible = false
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(tick) }

    const build = () => {
      const r = c.getBoundingClientRect(); dpr = devicePixelRatio || 1
      w = Math.max(1, r.width); h = Math.max(1, r.height)
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
      pixels = buildPixels(w, h, pixelSize, gap, direction, pattern, seed, jitter, accentShare)
      for (const p of pixels) {
        p.texNudge = Math.abs((p.left * 73856093) ^ (p.top * 19349663)) % 1000 / 1000 // stable, independent of Framer's RNG
        // Device-pixel rect, snapped so fractional DPR (e.g. 125%) leaves no seams.
        p.l = Math.round(p.left * dpr); p.t = Math.round(p.top * dpr)
        p.w = Math.round((p.left + p.size) * dpr) - p.l; p.h = Math.round((p.top + p.size) * dpr) - p.t
      }
      state = new Int8Array(pixels.length)
      buildTex()
      pos = target(); vel = 0
      drawn = -1; draw(pos)
    }

    const ro = new ResizeObserver(build)
    ro.observe(c)
    // Off screen: no work. Coming back: jump straight to the right state instead of springing from a stale one.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) { pos = target(); vel = 0; draw(pos) }
    }, { rootMargin: '100px 0px' })
    io.observe(c)
    addEventListener('scroll', kick, { passive: true })
    return () => { ro.disconnect(); io.disconnect(); removeEventListener('scroll', kick); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, accentKey, pixelSize, gap, endAt, direction, pattern, easing, jitter, feather, smoothing, seed, accentShare, band])

  return <canvas ref={ref} className="pixels" aria-hidden="true" style={{ background: from }} />
}
