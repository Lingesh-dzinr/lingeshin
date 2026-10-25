import { useEffect, useRef, useState } from 'react'
import token from '../lib/token'

// Port of the Framer code component Workshop/SpaceShooter.tsx with the footer's settings.
// Game state lives in a ref (no per-frame React renders); only the score is state.
const PLAYER = 32, ENEMY = 24, PX = 4, SPEED = 1
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

const hit = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

export default function SpaceShooter() {
  const wrap = useRef(null), cv = useRef(null), keys = useRef(new Set())
  const [score, setScore] = useState(0)

  useEffect(() => {
    const c = cv.current, x = c.getContext('2d')
    let W = 800, H = 600, raf = 0, visible = false, pts = 0, s
    // Colors, padding and fonts come from foundations.css (re-read on resize so breakpoints apply).
    let BG, WHITE, BULLET, FONT, OVER

    const reset = () => {
      pts = 0; setScore(0)
      s = { player: { x: W / 2 - PLAYER / 2, y: H - PLAYER - 50, width: PLAYER, height: PLAYER, speed: 5 },
        bullets: [], enemyBullets: [], enemies: [], explosions: [], lastSpawn: 0, lastFire: 0, over: false }
    }

    const resize = () => {
      const r = wrap.current.getBoundingClientRect()
      BG = token('--color-orange'); WHITE = token('--color-white'); BULLET = token('--color-blue')
      FONT = token('--font-pixel'); OVER = parseFloat(token('--game-over'))
      const p = parseFloat(token('--game-pad'))
      W = c.width = Math.max(400, r.width - p * 2); H = c.height = Math.max(300, r.height - p * 2)
      if (s) { s.player.x = W / 2 - PLAYER / 2; s.player.y = H - PLAYER - 50 }
    }

    const update = () => {
      if (s.over) return
      const now = Date.now(), p = s.player, k = keys.current
      if (k.has('ArrowLeft') && p.x > 0) p.x -= p.speed * SPEED
      if (k.has('ArrowRight') && p.x < W - p.width) p.x += p.speed * SPEED
      if (k.has('ArrowUp') && p.y > 0) p.y -= p.speed * SPEED
      if (k.has('ArrowDown') && p.y < H - p.height) p.y += p.speed * SPEED

      if (now - s.lastFire > 200) { s.bullets.push({ x: p.x + p.width / 2 - 2, y: p.y, width: 4, height: 12, speed: 8, active: true }); s.lastFire = now }
      s.bullets = s.bullets.filter(b => (b.y -= b.speed * SPEED) > -b.height)
      s.enemyBullets = s.enemyBullets.filter(b => (b.y += b.speed * SPEED) < H + b.height)

      if (now - s.lastSpawn > 1000) {
        s.enemies.push({ x: Math.random() * (W - ENEMY), y: -ENEMY, width: ENEMY, height: ENEMY, speed: 2 + Math.random() * 3, active: true, type: Math.random() * 2 | 0 })
        s.lastSpawn = now
      }
      s.enemies = s.enemies.filter(e => {
        e.y += e.speed * SPEED
        if (Math.random() < 0.005 * SPEED) s.enemyBullets.push({ x: e.x + e.width / 2 - 2, y: e.y + e.height, width: 4, height: 8, speed: 4, active: true })
        return e.y < H + e.height
      })

      for (const b of s.bullets) for (const e of s.enemies) if (b.active && e.active && hit(b, e)) {
        b.active = e.active = false
        s.explosions.push({ x: e.x + e.width / 2, y: e.y + e.height / 2, frame: 0 })
        setScore(pts += (e.type + 1) * 10)
      }
      const die = () => { s.over = true; s.explosions.push({ x: p.x + p.width / 2, y: p.y + p.height / 2, frame: 0 }) }
      if (s.enemies.some(e => e.active && hit(e, p)) || s.enemyBullets.some(b => hit(b, p))) die()

      s.bullets = s.bullets.filter(b => b.active)
      s.enemies = s.enemies.filter(e => e.active)
      s.explosions = s.explosions.filter(e => ++e.frame < 10)
    }

    const ship = (sx, sy, sc, parts) => { x.fillStyle = WHITE; for (const [a, b, w, h] of parts) x.fillRect(sx + a * sc, sy + b * sc, w * sc, h * sc) }
    const snap = v => Math.floor(v / PX) * PX

    const render = () => {
      x.fillStyle = BG; x.fillRect(0, 0, W, H)
      const p = s.player
      if (!s.over) ship(snap(p.x), snap(p.y), p.width / 32, [[12, 0, 8, 24], [0, 16, 32, 8], [8, 4, 16, 8], [4, 24, 8, 8], [20, 24, 8, 8]])
      x.fillStyle = BULLET; for (const b of s.bullets) x.fillRect(snap(b.x), snap(b.y), snap(b.width), snap(b.height))
      x.fillStyle = WHITE; for (const b of s.enemyBullets) x.fillRect(snap(b.x), snap(b.y), snap(b.width), snap(b.height))
      for (const e of s.enemies) ship(snap(e.x), snap(e.y), e.width / 24, [[10, 0, 4, 12], [4, 8, 16, 4], [8, 2, 8, 4], [6, 12, 4, 4], [14, 12, 4, 4]])
      x.fillStyle = WHITE
      for (const ex of s.explosions) {
        const half = ex.frame * 2
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.random() > 0.3) x.fillRect(snap(ex.x) + i * 8 - half, snap(ex.y) + j * 8 - half, 8, 8)
      }
      if (s.over) {
        const size = OVER
        x.fillStyle = BG; x.fillRect(0, 0, W, H)
        x.fillStyle = WHITE; x.textAlign = 'center'
        x.font = `${size}px ${FONT}`; x.fillText('GAME OVER', W / 2, H / 2 - 40)
        x.font = `${size / 2}px ${FONT}`
        x.fillText(`Final Score: ${pts}`, W / 2, H / 2)
        x.fillText('Press any key to restart', W / 2, H / 2 + 40)
      }
    }

    const loop = () => { if (visible) { update(); render() } raf = requestAnimationFrame(loop) }

    // ponytail: keys are only captured while the game is on screen, so arrow keys still scroll the page elsewhere.
    const down = e => {
      if (!visible) return
      if (ARROWS.includes(e.key)) { e.preventDefault(); keys.current.add(e.key) }
      if (s.over) { e.preventDefault(); reset() }
    }
    const up = e => keys.current.delete(e.key)

    resize(); reset()
    const ro = new ResizeObserver(resize); ro.observe(wrap.current)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) keys.current.clear() })
    io.observe(c)
    addEventListener('keydown', down); addEventListener('keyup', up)
    raf = requestAnimationFrame(loop)
    c.onclick = () => s.over && reset()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('keydown', down); removeEventListener('keyup', up) }
  }, [])

  // Touch: hold on a side of the canvas to steer (horizontal or vertical, whichever is further from centre).
  const steer = e => {
    e.preventDefault()
    const k = keys.current, r = cv.current.getBoundingClientRect(), t = e.touches[0]
    ARROWS.forEach(a => k.delete(a))
    if (!t) return
    const dx = t.clientX - r.left - r.width / 2, dy = t.clientY - r.top - r.height / 2
    k.add(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight') : (dy < 0 ? 'ArrowUp' : 'ArrowDown'))
  }

  return (
    <div ref={wrap} className="shooter">
      <canvas ref={cv}
        onTouchStart={steer} onTouchMove={steer} onTouchEnd={steer} aria-label="Retro shooter game" />
      <div className="hud score">SCORE: {score}</div>
      <div className="hud hint">Arrow Keys / Touch to Move</div>
    </div>
  )
}
