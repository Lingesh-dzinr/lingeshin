import { Fragment, useEffect, useRef, useState } from 'react'
import SenseWord from './SenseWord'

// Hero text while the hero is pinned (andreas.vision's word reveal, adapted):
//  · the intro leaves with the reveal played backwards — each word shrinks on stepped frames while
//    a pixel mark pops beside it and vanishes — one word after another; scrolling back to the top
//    plays the forward reveal so it returns the same way,
//    "sense" stays behind in its place: the other words leave first, then it leaves last with the
//    same reverse reveal (and returns first),
//  · then "Selected work" arrives with the forward reveal once the sky is solid blue.
// Progress p runs 0 → 1 over the first screen of scrolling past the top of .hero-stage.
const LEAVE_AT = 0.04   // intro starts leaving almost as soon as the visitor scrolls
const WORK_AT = 0.6     // "Selected work" reveals once the sky is (almost) solid blue

const intro = ['I', 'sense', "what's", 'broken', 'before', 'users', 'do.']
const work = ['Selected', 'work']
const SENSE = intro.indexOf('sense')

// Each word gets a side and a corner for its mark, so words appear from different directions:
// the first half of a line grows out of marks on their left, the rest out of marks on their right
// (two neighbours never put marks in the same gap), and the corner alternates top / bottom.
// i = position (picks the side); order = place in the timing (defaults to position).
const Word = ({ i, n, order = i, className = '', children }) => (
  <><span className={'word ' + className} style={{ '--i': order }} data-side={i < n / 2 ? 'left' : 'right'} data-v={i % 2 ? 'top' : 'bottom'}>
    <span className="mark" /><span className="text">{children}</span>
  </span>{' '}</>
)

export default function HeroCopy() {
  const box = useRef(null)
  const [intro_, setIntro] = useState('idle') // idle (no animation) · out · in
  const [workOn, setWorkOn] = useState(false)

  useEffect(() => {
    const stage = box.current.closest('.hero-stage')
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, -stage.getBoundingClientRect().top / innerHeight))
      setIntro(s => (p >= LEAVE_AT ? 'out' : s === 'out' ? 'in' : s))
      setWorkOn(p >= WORK_AT)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick)
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', kick); removeEventListener('resize', kick) }
  }, [])

  return (
    <div className={'hero-copy intro-' + intro_} ref={box}>
      <h1 className="t-display hero-intro">
        {intro.map((w, i) => w === 'sense'
          ? <Fragment key={w}><Word i={i} n={intro.length} order={0} className="is-sense"><SenseWord /></Word></Fragment>
          : <Fragment key={w}><Word i={i} n={intro.length} order={i < SENSE ? i : i - 1}>{w}</Word></Fragment>)}
      </h1>
      <div className="meta t-body" style={{ '--i': intro.length - 1 }}>
        <p>2+ years designing across Legal Tech, EdTech, SaaS, and Telecom — blending creativity, design systems, and UX psychology, one pixel at a time.</p>
        <p>Currently @ariviti</p>
      </div>
      <h2 className={'hero-work t-display' + (workOn ? ' on' : '')} aria-hidden={!workOn}>
        {work.map((w, i) => <Fragment key={w}><Word i={i} n={work.length}>{w}</Word></Fragment>)}
      </h2>
    </div>
  )
}
