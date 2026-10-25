// Read a design token from foundations.css, for canvas code that can't use CSS vars directly.
// Accepts "--color-orange" or "var(--color-orange)"; anything else is returned unchanged.
export default function token(v) {
  const name = v.startsWith('var(') ? v.slice(4, -1) : v
  return name.startsWith('--') ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : v
}
