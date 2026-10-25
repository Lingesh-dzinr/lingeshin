import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSky from '../components/HeroSky'
import HeroCopy from '../components/HeroCopy'
import PixelCloud from '../components/PixelCloud'

// Each card's pixel clouds use their own palette (deep, mid, soft — see foundations.css).
const palettes = {
  orange: ['--color-card-orange-deep', '--color-card-orange', '--color-card-orange-soft'],
  ink: ['--color-card-ink-deep', '--color-card-ink', '--color-card-ink-soft'],
  yellow: ['--color-card-yellow-deep', '--color-card-yellow', '--color-card-yellow-soft'],
}

const works = [
  { title: 'Yalamanchili developer portal: Turning dense, technical API sharing interface into a streamlined process', img: 'work-ysp.jpg', to: '/work/yalamanchili_developer_portal', palette: palettes.orange },
  { title: 'The Hyphen - Literary Magazine', img: 'work-hyphen.png', href: 'https://the-hyphen.in/', palette: palettes.ink },
  { title: 'MyZakaPay', img: 'work-zakapay.jpg', palette: palettes.yellow },
]

// Card: title, then an art box — pixel clouds behind the mockup, which sits inset from the top-left.
// Cards alternate left / right / centre (data-pos).
function Work({ title, img, to, href, palette, i }) {
  const [hover, setHover] = useState(false) // hover fills the clouds with the card's solid colour
  const body = <>
    <h2 className="t-h2">{title}</h2>
    <div className="art">
      <PixelCloud palette={palette} seed={i + 3} active={hover} />
      <img className="img" src={`/assets/${img}`} alt="" loading="lazy" />
    </div>
  </>
  const props = { className: 'work-card', 'data-pos': ['left', 'right', 'center'][i % 3],
    onPointerEnter: () => setHover(true), onPointerLeave: () => setHover(false), onFocus: () => setHover(true), onBlur: () => setHover(false) }
  if (to) return <Link {...props} to={to}>{body}</Link>
  if (href) return <a {...props} href={href}>{body}</a>
  return <div {...props}>{body}</div>
}

export default function Home() {
  useEffect(() => { document.title = 'Lingesh - UX/UI Designer | Portfolio | Home' }, [])

  return (
    // One stage: the hero (sky + text) stays pinned for the whole stage. The first screen of scroll
    // (.hero-scrub) fades the intro out, fills the sky with solid blue and reveals "Selected work";
    // then the work cards scroll up over it and on past.
    <div className="hero-stage">
      <div className="hero-sticky">
        <HeroSky />
        <header className="hero">
          <div className="hero-in">
            <div className="hero-block">
              <HeroCopy />
            </div>
          </div>
        </header>
      </div>
      <div className="hero-scrub" aria-hidden="true" />
      <main className="work-cards">{works.map((w, i) => <Work key={w.img} i={i} {...w} />)}</main>
    </div>
  )
}
