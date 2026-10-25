import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Nav from './components/Nav'
import Footer from './components/Footer'
import PixelTransition from './components/PixelTransition'
import useReveal from './lib/useReveal'
import Home from './pages/Home'
import About from './pages/About'
import Yalamanchili from './pages/Yalamanchili'
import './index.css'

const WHITE4 = Array(4).fill('var(--color-white)')

// Framer "Smooth Scroll" component (intensity 10).
const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -96 } })
const raf = t => { lenis.raf(t); requestAnimationFrame(raf) }
requestAnimationFrame(raf)

function App() {
  const { pathname, hash } = useLocation()
  useReveal()
  useEffect(() => { if (!hash) lenis.scrollTo(0, { immediate: true }) }, [pathname, hash])

  return <>
    <Nav />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/work/yalamanchili_developer_portal" element={<Yalamanchili />} />
    </Routes>
    <PixelTransition from="var(--color-white)" to="var(--color-orange)" accents={WHITE4} feather={0.01} />
    <Footer />
  </>
}

createRoot(document.getElementById('root')).render(
  <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>
)
