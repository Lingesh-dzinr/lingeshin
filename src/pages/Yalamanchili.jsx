import { useEffect, useState } from 'react'

const details = [
  ['My role', 'UI Designer'],
  ['Team', 'Me\nSenior UX Designer'],
  ['Timeline', '6 months'],
  ['Collaborated with', 'Business Analyst\nProject Manager\nEngineering & Testing'],
]
const sections = ['Overview', 'Problem', 'Challenges', 'Approach', 'Wireframes', 'Impact', 'Learnings']

const List = ({ items, tight }) => (
  <ol className={'list' + (tight ? ' tight' : '')}>
    {items.map((t, i) => <li key={i}><span className={(tight ? 't-body' : 't-h6b') + ' n'}>0{i + 1}.</span><span className="t-body">{t}</span></li>)}
  </ol>
)

const Section = ({ id, title, gap = 40, children }) => (
  <section className="cs-section" id={id}>
    <h2 className="t-h4">{title}</h2>
    <div className="stack" style={{ gap }}>{children}</div>
  </section>
)

// Framer VerticalNavItem: highlights the section currently in view.
function useActive(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' })
    ids.forEach(id => io.observe(document.getElementById(id)))
    return () => io.disconnect()
  }, [ids])
  return active
}

const ids = sections.map(s => s.toLowerCase())

export default function Yalamanchili() {
  useEffect(() => { document.title = 'Yalamanchili Developer Portal | Lingesh' }, [])
  const active = useActive(ids)

  return (
    <>
      <div className="cs-head reveal">
        <h1 className="t-h1b">Yalamanchili developer portal: Turning dense, technical API sharing interface into a streamlined process</h1>
        <div className="cs-details">
          {details.map(([k, v]) => <div key={k}><p className="t-h6b">{k}</p><p className="t-h6">{v}</p></div>)}
        </div>
        <div className="cs-hero"><img src="/assets/work-ysp.jpg" alt="Yalamanchili developer portal screens" /></div>
      </div>

      <div className="cs-body reveal">
        <nav className="vnav t-h6" aria-label="Sections">
          {sections.map((s, i) => <a key={s} href={'#' + ids[i]} className={active === ids[i] ? 'active' : ''}>{s}</a>)}
        </nav>

        <div className="cs-content">
          <Section id="overview" title="Company overview">
            <p className="t-body">Yalamanchili is a leading global technology solutions provider, specializing in payment and cards, that designs and implements customized, flexible, scalable ad innovative solutions for client around the world.</p>
          </Section>

          <Section id="problem" title="Problem">
            <p className="t-body">API onboarding at Yalamanchili takes more effort than it needs to. Clients receive email docs that aren’t always current, and they don’t have an easy way to explore or test the API on their own. Instead of moving ahead with certainty, they end up turning to the internal team for almost everything, which slows the whole process for both sides.</p>
          </Section>

          <Section id="challenges" title="Challenges" gap={64}>
            <div className="stack" style={{ gap: 12 }}>
              <p className="t-h6 sub">For Users</p>
              <div className="stack" style={{ gap: 24 }}>
                <p className="t-body">After multiple discussions with YM team we identified these issues</p>
                <List items={[
                  'Manual work introduces inconsistencies that lead to errors in the API spec, including typos and syntax issues.',
                  'Creating and maintaining documentation by hand takes a lot of time, especially for large APIs.',
                  'Integration testing requires early technical support unless a sandbox is available.',
                  'Tracking changes across API versions is difficult.',
                ]} />
              </div>
            </div>
            <div className="stack" style={{ gap: 24 }}>
              <p className="t-h6 sub">As a Designer</p>
              <List items={[
                'Taking on a major project for the first time and feeling the weight of expectations',
                'Tight deadlines that leave little room for exploration or iteration',
              ]} />
            </div>
          </Section>

          <Section id="approach" title="Approach" gap={64}>
            <div className="stack" style={{ gap: 12 }}>
              <p className="t-h6 sub">User stories</p>
              <p className="t-body">Our business analyst outlined all the user types and their stories, then walked through it with the client to confirm expectations and make sure we had a solid picture of what the product needed to support.</p>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              <p className="t-h6 sub">User - Flow</p>
              <div className="stack" style={{ gap: 24 }}>
                <p className="t-body">We kicked things off by mapping the userflow, information architecture, and early wireframes in Whimsical. From there, we walked through everything with the YM team to spot technical constraints and understand what was realistic before moving deeper into design.</p>
                <iframe className="embed" title="User flow in Whimsical" loading="lazy" src="https://whimsical.com/embed/7bT38rrkwMAkWSbSjLiAAs@GjdVyJ6vu7AarUz5dgFsJ7G4SzSDdtUNgjLkeH1SMhHC" />
              </div>
            </div>
            <p className="thanks">🙏 Thanks to our BA for helping through this entire project</p>
          </Section>

          <Section id="wireframes" title="High-Fidelity wireframes" gap={10}>
            <div className="stack" style={{ gap: 64 }}>
              {[['Login', 'ysp-1.jpg', 600], ['Dashboard', 'ysp-2.jpg', 600], ['Product management', 'ysp-3.jpg', 841]].map(([t, img, h]) => (
                <div key={t} className="stack" style={{ gap: 12 }}>
                  <p className="t-h6 sub">{t}</p>
                  <img className="shot" src={`/assets/${img}`} alt={`${t} screens`} loading="lazy" style={{ height: h }} />
                </div>
              ))}
            </div>
            <p className="t-h4i">and more…</p>
          </Section>

          <Section id="impact" title="Impact">
            <div className="stats">
              <div><p className="t-h1b">~500+</p><p className="t-body">Screens designed for both Admin &amp; Partner user</p></div>
              <div><p className="t-h1b up">+85%</p><p className="t-body">Increase in efficiency as managing documentation &amp; APIs becomes easier</p></div>
              <div><p className="t-h1b up">-60%</p><p className="t-body">Reduction in technical support request</p></div>
            </div>
          </Section>

          <Section id="learnings" title="Learnings" gap={24}>
            <p className="t-body">This was my first major project in product design and a real eye-opener, showing me how I can collaborating across teams, and designing solutions that work in the real world.</p>
            <List tight items={[
              'Gaining technical knowledge about the domain and understanding how the existing product works is crucial.',
              'Collaborating closely with a cross-functional team—developers, clients, BAs, and PMs—is essential for smooth progress.',
              'Even small copy changes, like a single heading, can impact the meaning of subsequent steps.',
              'Learning to make trade-offs and prioritize decisions while balancing project constraints is a vital skill.',
            ]} />
          </Section>
        </div>
      </div>
    </>
  )
}
