import ArrowLink from './ArrowLink'
import { LINKEDIN } from './Nav'
import SpaceShooter from './SpaceShooter'

export default function Footer() {
  return (
    <footer className="footer" id="contact" data-nav-dark>
      <div className="title">
        <div className="roles"><p className="t-h5">Let's talk!</p></div>
        <div className="exp">
          <p className="t-body">I’d love to hear from you! Whether you need more information, hire me, or just want to chat, feel free to reach out.</p>
          <div className="links">
            <ArrowLink dark to="mailto:lingesh010503@gmail.com">Email</ArrowLink>
            <ArrowLink dark to={LINKEDIN}>LinkedIn</ArrowLink>
            <ArrowLink dark to="/about">Resume</ArrowLink>
          </div>
        </div>
      </div>
      <SpaceShooter />
    </footer>
  )
}
