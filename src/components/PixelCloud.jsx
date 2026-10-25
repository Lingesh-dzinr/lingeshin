import { useEffect, useRef } from 'react'
import token from '../lib/token'
import noise2 from '../lib/noise'

// Drifting pixel clouds for a work card's image area — the hero sky's look (dots → stripes →
// light fill → solid) in a card's own palette, filling the whole box. Draws only while on screen.
// While `active` (card hovered) every cell dissolves to the solid deep colour, like the hero's scroll fill.
const CELL = 16

const FILL_IN = 0.45, FILL_OUT = 0.35 // seconds

export default function PixelCloud({ palette, seed = 1, active = false }) {
  const ref = useRef(null), on = useRef(active)
  on.current = active

  useEffect(() => {
    const c = ref.current, x = c.getContext('2d'), n = noise2(seed)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let fill = 0, lastT = 0, dpr = 1, cols = 0, rows = 0, xs = [], ys = [], level = new Int8Array(0), fills = [], raf = 0, last = 0, visible = false

    const tile = (size, paint) => { const t = document.createElement('canvas'); t.width = t.height = size; paint(t.getContext('2d')); return x.createPattern(t, 'repeat') }
    const resize = () => {
      const r = c.getBoundingClientRect(); dpr = devicePixelRatio || 1
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr)
      cols = Math.ceil(r.width / CELL); rows = Math.ceil(r.height / CELL)
      xs = Array.from({ length: cols + 1 }, (_, i) => Math.round(i * CELL * dpr))
      ys = Array.from({ length: rows + 1 }, (_, i) => Math.round(i * CELL * dpr))
      level = new Int8Array(cols * rows)
      const [deep, mid, soft] = palette.map(token), u = Math.max(1, Math.round(dpr))
      fills = [null,
        tile(u * 2, g => { g.fillStyle = mid; g.fillRect(0, 0, u, u) }),       // dots
        tile(u * 2, g => { g.fillStyle = mid; g.fillRect(0, 0, u * 2, u) }),   // stripes
        soft,                                                                   // light fill
        deep]                                                                   // solid
      x.clearRect(0, 0, c.width, c.height); draw(performance.now())
    }

    const draw = t => {
      const drift = (still ? 0 : t / 1000) * 0.06
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const f = 0.55 * n(q * 0.09 + drift, r * 0.13) + 0.3 * n(q * 0.21 - drift * 1.7, r * 0.25 + 40) + 0.15 * n(q * 0.5 + drift * 2.3, r * 0.5 + 90)
        let lv = f > 0.58 ? 4 : f > 0.5 ? 3 : f > 0.42 ? 2 : f > 0.34 ? 1 : 0
        if (fill > 0 && fill * 1.1 > 0.08 + 0.92 * n(q * 0.33, r * 0.33 + 1300)) lv = 4 // ragged dissolve to solid
        const i = r * cols + q
        if (level[i] === lv) continue
        level[i] = lv
        const x0 = xs[q], y0 = ys[r], cw = xs[q + 1] - x0, ch = ys[r + 1] - y0
        x.clearRect(x0, y0, cw, ch)
        if (lv) { x.fillStyle = fills[lv]; x.fillRect(x0, y0, cw, ch) }
      }
    }

    const loop = t => {
      const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0
      lastT = t
      fill = still ? (on.current ? 1 : 0) : on.current ? Math.min(1, fill + dt / FILL_IN) : Math.max(0, fill - dt / FILL_OUT)
      if (visible && t - last > 32) { last = t; draw(still ? 0 : t) }
      raf = requestAnimationFrame(loop)
    }
    const ro = new ResizeObserver(resize); ro.observe(c)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(c)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [palette, seed])

  return <canvas ref={ref} className="pixel-cloud" aria-hidden="true" />
}
