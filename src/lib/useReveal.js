import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Framer appear effects: add .in once an element scrolls into view.
export default function useReveal() {
  const { pathname } = useLocation()
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }))
    document.querySelectorAll('.reveal, .rise').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
}
