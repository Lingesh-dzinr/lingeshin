import { useEffect } from 'react'

// The Framer About page only has this heading so far.
export default function About() {
  useEffect(() => { document.title = 'About | Lingesh' }, [])
  return <section className="about"><h1 className="t-display">Ore no nawa Lingesh</h1></section>
}
