import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ArrowLink from './ArrowLink'

export const LINKEDIN = 'https://www.linkedin.com/in/lingesh-p-396269269'

const Content = ({ open, toggle }) => <>
  <div className="bar">
    <Link className="link2 t-link" to="/">Lingesh</Link>
    <button className="toggle" aria-label="Menu" aria-expanded={open} onClick={toggle}><i /><i /></button>
  </div>
  <ul className="items">
    <li><Link className="link2 t-link" to="/">Home</Link></li>
    <li><Link className="link2 t-link" to="/about">About</Link></li>
    <li className="dim"><Link className="link2 t-link" to="/about">Playground</Link></li>
    <li><ArrowLink to="/about">Resume</ArrowLink></li>
  </ul>
</>

// Stripe-style adaptive ink: a white copy of the nav is clipped to wherever a
// [data-nav-dark] section sits under the bar, so text recolours exactly at the edge.
function useInkClip(navRef, inkRef) {
  const { pathname } = useLocation()
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const nav = navRef.current, ink = inkRef.current
      if (!nav || !ink) return
      const h = nav.offsetHeight
      let top = h, bottom = 0
      for (const el of document.querySelectorAll('[data-nav-dark]')) {
        const r = el.getBoundingClientRect()
        if (r.bottom > 0 && r.top < h) { top = Math.min(top, Math.max(0, r.top)); bottom = Math.max(bottom, Math.min(h, r.bottom)) }
      }
      ink.style.clipPath = bottom > top ? `inset(${top}px 0 ${h - bottom}px 0)` : 'inset(100% 0 0 0)'
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick)
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', kick); removeEventListener('resize', kick) }
  }, [pathname, navRef, inkRef])
}

export default function Nav() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null), ink = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useInkClip(ref, ink)
  const toggle = () => setOpen(o => !o)

  return (
    <nav className={'nav' + (open ? ' open' : '')} ref={ref}
      style={open ? { '--open-h': ref.current.scrollHeight + 'px' } : undefined}>
      <Content open={open} toggle={toggle} />
      <div className="nav-ink" ref={ink} aria-hidden="true" inert>
        <Content open={open} />
      </div>
      {/* Masked by HeroSky to the deep-blue cloud cells under the bar. */}
      <div className="nav-ink nav-ink-sky" aria-hidden="true" inert>
        <Content open={open} />
      </div>
    </nav>
  )
}
