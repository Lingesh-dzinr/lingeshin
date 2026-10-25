import { Link } from 'react-router-dom'

// Framer "Link": mono label + feather arrow that rotates from → to ↗ on hover.
export default function ArrowLink({ to, children, dark }) {
  const ext = /^(https?:|mailto:)/.test(to)
  const body = <>
    {children}
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
  </>
  const cls = 'link t-link' + (dark ? ' on-dark' : '')
  return ext ? <a className={cls} href={to}>{body}</a> : <Link className={cls} to={to}>{body}</Link>
}
