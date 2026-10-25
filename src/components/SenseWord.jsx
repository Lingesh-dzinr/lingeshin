import { useEffect, useRef, useState } from 'react'
import senseSvg from '../assets/sense.svg?raw'

// The word "sense". On hover the spider-sense rays (the original vector) shoot out, then their
// squiggles crawl like the Spider-Verse reference (tenor 12678047: 29 frames × 60ms = 1.74s loop).
// In the reference each squiggle stays put and keeps its outline; only the wave travels along it,
// about a quarter wavelength per frame. We reproduce that per ray: a wave pattern aimed along the
// ray, matched to the squiggle's own spacing, displaces the shape very slightly (≈1 unit) and steps
// outward every 60ms, so the existing crests appear to travel without redrawing the artwork.
// Hovering also tells HeroSky to blow the pixel clouds away.
const signal = on => dispatchEvent(new CustomEvent('spidey-sense', { detail: on }))

const ORIGIN = { x: 96.5, y: 72 } // bottom centre of the 193 × 72 viewBox, where the word sits
const WAVE = 12                   // squiggle wavelength in the vector (viewBox units)
const AMP = 1.2                   // sideways shift, kept below the ray thickness so the outline holds
const FRAME_MS = 60               // reference frame time
const STEP = WAVE / 4             // crest advance per frame, as in the reference

const svgNS = 'http://www.w3.org/2000/svg'

// Stripe image for one ray: red/green encode a push perpendicular to the ray (−uy, ux) that follows
// a sine along the ray direction (ux, uy). 0.5 = no push.
function wavePattern(ux, uy, w, h) {
  const px = -uy, py = ux
  const col = s => `rgb(${Math.round(255 * (0.5 + 0.5 * s * px))},${Math.round(255 * (0.5 + 0.5 * s * py))},128)`
  const svg = `<svg xmlns="${svgNS}" width="${w}" height="${h}"><defs><linearGradient id="w" gradientUnits="userSpaceOnUse"
    x1="0" y1="0" x2="${(ux * WAVE).toFixed(3)}" y2="${(uy * WAVE).toFixed(3)}" spreadMethod="repeat">
    <stop offset="0" stop-color="${col(0)}"/><stop offset=".25" stop-color="${col(1)}"/><stop offset=".5" stop-color="${col(0)}"/>
    <stop offset=".75" stop-color="${col(-1)}"/><stop offset="1" stop-color="${col(0)}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#w)"/></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

export default function SenseWord() {
  const [on, setOn] = useState(false)
  const box = useRef(null), waves = useRef([])

  // Build one wave filter per ray, inside the vector's own <defs>.
  useEffect(() => {
    const svg = box.current.querySelector('svg'), defs = svg.querySelector('defs')
    waves.current = [...svg.querySelectorAll('path')].map((p, i) => {
      const b = p.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2
      const len = Math.hypot(cx - ORIGIN.x, cy - ORIGIN.y) || 1
      const ux = (cx - ORIGIN.x) / len, uy = (cy - ORIGIN.y) / len
      const pad = 4, rx = b.x - pad, ry = b.y - pad, rw = b.width + pad * 2, rh = b.height + pad * 2
      const f = document.createElementNS(svgNS, 'filter')
      f.id = `sense-wave-${i}`
      for (const [k, v] of Object.entries({ filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', x: rx, y: ry, width: rw, height: rh }))
        f.setAttribute(k, v)
      // the image is one wavelength larger on every side so it can slide without exposing an edge
      const img = document.createElementNS(svgNS, 'feImage')
      const iw = rw + WAVE * 2, ih = rh + WAVE * 2
      for (const [k, v] of Object.entries({ href: wavePattern(ux, uy, iw, ih), x: rx - WAVE, y: ry - WAVE, width: iw, height: ih, preserveAspectRatio: 'none', result: 'wave' }))
        img.setAttribute(k, v)
      const disp = document.createElementNS(svgNS, 'feDisplacementMap')
      for (const [k, v] of Object.entries({ in: 'SourceGraphic', in2: 'wave', scale: AMP * 2, xChannelSelector: 'R', yChannelSelector: 'G' }))
        disp.setAttribute(k, v)
      f.append(img, disp); defs.append(f)
      p.setAttribute('filter', `url(#${f.id})`)
      return { img, ux, uy, x0: rx - WAVE, y0: ry - WAVE, f, p }
    })
    // Reveal one by one, left to right across the fan, 30ms apart.
    const order = [...waves.current].sort((a, b) => Math.atan2(a.uy, a.ux) - Math.atan2(b.uy, b.ux))
    order.forEach((w, k) => w.p.style.setProperty('--reveal-delay', `${k * 30}ms`))
    return () => { for (const w of waves.current) { w.f.remove(); w.p.removeAttribute('filter') } }
  }, [])

  // Step the waves outward every 60ms while hovered (stepped like the reference, not smoothed).
  useEffect(() => {
    if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const step = () => {
      const shift = (frame * STEP) % WAVE
      for (const w of waves.current) {
        w.img.setAttribute('x', (w.x0 + w.ux * shift).toFixed(3))
        w.img.setAttribute('y', (w.y0 + w.uy * shift).toFixed(3))
      }
      frame++
    }
    step()
    const id = setInterval(step, FRAME_MS)
    return () => clearInterval(id)
  }, [on])

  const enter = () => { setOn(true); signal(true) }
  const leave = () => { setOn(false); signal(false) }

  return (
    <em className={'sense-word' + (on ? ' on' : '')} onPointerEnter={enter} onPointerLeave={leave}>
      sense
      <span className="sense" ref={box} aria-hidden="true" dangerouslySetInnerHTML={{ __html: senseSvg }} />
    </em>
  )
}
