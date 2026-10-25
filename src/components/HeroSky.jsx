import { useEffect, useRef } from 'react'
import token from '../lib/token'
import noise2 from '../lib/noise'

// Drifting pixel-cloud backdrop for the hero (inspired by andreas.vision).
// Fractal value noise, sampled on a grid of square cells, quantised into 4 densities:
// dotted → striped → light fill → solid. Clouds stay away from the headline (bottom-right)
// and thin out as you scroll the hero away.
const CELL = 20

export default function HeroSky() {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current, x = c.getContext('2d'), n = noise2(7)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, heroH = 1, clearZone = null, origin = null, burst = 0, burstTarget = 0, lastBurstT = 0, dpr = 1, cols = 0, rows = 0, raf = 0, visible = true, fills = [], level = new Int8Array(0), xs = [], ys = [], lastT = 0

    // One canvas pattern per density, tinted with the foundation colours, built in device pixels.
    const tile = (size, paint) => { const t = document.createElement('canvas'); t.width = t.height = size; paint(t.getContext('2d')); return x.createPattern(t, 'repeat') }
    const buildFills = () => {
      const deep = token('--color-sky-deep'), mid = token('--color-sky'), soft = token('--color-sky-soft')
      const u = Math.max(1, Math.round(2 * dpr)), hair = Math.max(1, Math.round(dpr))
      fills = [
        null,
        tile(u * 2, g => { g.fillStyle = mid; g.fillRect(0, 0, u, u) }),     // dots (one every other pixel step — dense)
        tile(hair * 2, g => { g.fillStyle = mid; g.fillRect(0, 0, hair * 2, hair) }), // stripes (fine, dense lines)
        soft,                                                                // light fill
        deep,                                                                // solid
      ]
    }

    const resize = () => {
      const r = c.getBoundingClientRect(); dpr = devicePixelRatio || 1
      w = r.width; h = r.height
      heroH = c.parentElement.querySelector('.hero')?.offsetHeight || h // canvas covers the pinned hero, edge to edge
      // Measure the text block so the clearing wraps it.
      const b = c.parentElement.querySelector('.hero-copy')?.getBoundingClientRect()
      if (b) {
        const x0 = b.left - r.left, x1 = b.right - r.left, y0 = b.top - r.top - 56, y1 = b.bottom - r.top // 56: room for the "sense" burst
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2, hh = (y1 - y0) / 2
        clearZone = { cx, cy, rx: Math.min(hw + 150, w / 2 + 40), ry: hh + Math.min(130, h * 0.08) } // cloud-edged clearing around the text
      } else clearZone = null
      // Spidey-sense origin: the centre of the word "sense"; the clear-out spreads from here to the farthest corner.
      const sw = c.parentElement.querySelector('.sense-word')?.getBoundingClientRect()
      origin = sw && { x: sw.left - r.left + sw.width / 2, y: sw.top - r.top + sw.height / 2 }
      if (origin) origin.max = Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([a, b]) => Math.hypot(a - origin.x, b - origin.y)))
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL)
      // device-pixel cell edges, snapped so fractional DPR leaves no seams
      xs = Array.from({ length: cols + 1 }, (_, i) => Math.round(i * CELL * dpr))
      ys = Array.from({ length: rows + 1 }, (_, i) => Math.round(i * CELL * dpr))
      level = new Int8Array(cols * rows)
      x.clearRect(0, 0, c.width, c.height)
      buildFills(); draw(performance.now())
    }

    // White, cloud-edged clearing around the text (0 sky … 1 clear).
    const clearing = (px, py, drift) => {
      const wobble = (n(px * 0.012 + drift * 0.5, py * 0.012 + 300) - 0.5) * 0.22 // organic clearZone edge
      const { cx, cy, rx, ry } = clearZone
      const e = Math.hypot((px - cx) / rx, (py - cy) / ry) + wobble                // <1 inside the clearZone
      const clear = e < 0.92 ? 1 : Math.max(0, 1 - (e - 0.92) / 0.18)
      return clear
    }

    // Only cells whose density changed are repainted.
    const draw = t => {
      const time = still ? 0 : t / 1000
      // Scroll fill: over the first screen past the top of the stage the sky turns completely solid blue.
      const stage = c.closest('.hero-stage')
      const p = stage ? Math.min(1, Math.max(0, -stage.getBoundingClientRect().top / innerHeight)) : 0
      const fill = Math.min(1, Math.max(0, (p - 0.1) / 0.5))           // 0 at 10% → 1 at 60% of the scrub
      const drift = time * 0.06
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const clear = clearZone ? clearing((q + 0.5) * CELL, (r + 0.5) * CELL, drift) : 0
          let f = 0.55 * n(q * 0.09 + drift, r * 0.13) + 0.3 * n(q * 0.21 - drift * 1.7, r * 0.25 + 40) + 0.15 * n(q * 0.5 + drift * 2.3, r * 0.5 + 90)
          f = f - clear * 0.95 * (1 - fill)
          let lv = f > 0.52 ? 4 : f > 0.44 ? 3 : f > 0.36 ? 2 : f > 0.27 ? 1 : 0 // density: lower thresholds = fuller sky
          if (lv && burst > 0 && origin) {
            // ragged wavefront: cells inside the expanding radius are blown away
            const d = Math.hypot((q + 0.5) * CELL - origin.x, (r + 0.5) * CELL - origin.y) / origin.max
            // out: fast start (ease-out). back: also moves from the first frame (ease-in on the way down)
            const reach = burstTarget ? 1 - Math.pow(1 - burst, 3) : Math.pow(burst, 2.2)
            if (d + (n(q * 0.3, r * 0.3 + 700) - 0.5) * 0.12 < reach * 1.1) lv = 0
          }
          // ragged dissolve to solid blue — wins over everything else
          if (fill > 0 && fill * 1.1 > 0.08 + 0.92 * n(q * 0.33, r * 0.33 + 1300)) lv = 4
          const i = r * cols + q
          if (level[i] === lv) continue
          level[i] = lv
          const x0 = xs[q], y0 = ys[r], cw = xs[q + 1] - x0, ch = ys[r + 1] - y0
          x.clearRect(x0, y0, cw, ch)
          if (lv) { x.fillStyle = fills[lv]; x.fillRect(x0, y0, cw, ch) }
        }
      }
    }

    // Nav ink mask: paint the deep-blue cells currently under the fixed nav, so the white
    // copy of the nav shows only over them (text recolours cell by cell, like Stripe's hero text).
    const mask = document.createElement('canvas'), mx = mask.getContext('2d')
    let lastMask = ''
    const updateNavMask = () => {
      const ink = document.querySelector('.nav-ink-sky'), nav = ink?.parentElement
      if (!ink) return
      const nh = nav.offsetHeight, cr = c.getBoundingClientRect()
      const nw = ink.offsetWidth // same width as the layer it masks (excludes the scrollbar)
      if (mask.width !== nw || mask.height !== nh) { mask.width = nw; mask.height = nh }
      mx.clearRect(0, 0, mask.width, nh); mx.fillStyle = '#000'
      const r0 = Math.max(0, Math.floor(-cr.top / CELL)), r1 = Math.min(rows - 1, Math.floor((nh - cr.top) / CELL))
      for (let r = r0; r <= r1; r++) for (let q = 0; q < cols; q++)
        if (level[r * cols + q] >= 4) mx.fillRect(Math.round(cr.left + q * CELL), Math.round(cr.top + r * CELL), CELL, CELL)
      const url = r1 >= r0 ? mask.toDataURL() : ''
      if (url === lastMask) return
      lastMask = url
      const m = url ? `url(${url})` : 'linear-gradient(transparent,transparent)'
      ink.style.webkitMaskImage = m; ink.style.maskImage = m
    }

    // The clouds move slowly, so ~30fps is plenty and halves the work.
    // Burst eases towards its target: ~0.55s to clear everything, ~0.45s for the clouds to roll back, starting immediately.
    const stepBurst = t => {
      const dt = lastBurstT ? Math.min(0.1, (t - lastBurstT) / 1000) : 0
      lastBurstT = t
      burst = burstTarget > burst ? Math.min(1, burst + dt / 0.55) : Math.max(0, burst - dt / 0.45)
    }
    const loop = t => { stepBurst(t); if (visible && t - lastT > 32) { lastT = t; draw(t); updateNavMask() } if (!still) raf = requestAnimationFrame(loop) }
    const onSense = e => { burstTarget = e.detail ? 1 : 0; if (still) { burst = burstTarget; draw(0); updateNavMask() } }
    addEventListener('spidey-sense', onSense)
    const ro = new ResizeObserver(resize); ro.observe(c)
    const copy = c.parentElement.querySelector('.hero-copy'); if (copy) ro.observe(copy) // re-fit the clearing when the text reflows
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(c)
    // Redraw on the very next frame after a scroll, so the sky never trails the page.
    let scrollRaf = 0
    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(t => { scrollRaf = 0; draw(still ? 0 : t); updateNavMask() })
    }
    addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      const ink = document.querySelector('.nav-ink-sky')
      if (ink) { ink.style.webkitMaskImage = ''; ink.style.maskImage = '' }
      cancelAnimationFrame(raf); cancelAnimationFrame(scrollRaf); removeEventListener('spidey-sense', onSense); ro.disconnect(); io.disconnect(); removeEventListener('scroll', onScroll) }
  }, [])

  return <canvas ref={ref} className="hero-sky" aria-hidden="true" />
}
