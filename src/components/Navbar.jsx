import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'

const NAV_LINKS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Add Expense',
    path: '/expense',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'AI Insights',
    path: '/insights',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><circle cx="18" cy="6" r="3" fill="currentColor" />
      </svg>
    ),
    badge: 'AI',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --fino-bg: #0a0a0f;
          --fino-surface: #111118;
          --fino-border: rgba(255,255,255,0.07);
          --fino-accent: #00e5a0;
          --fino-accent-dim: rgba(0,229,160,0.12);
          --fino-accent-glow: rgba(0,229,160,0.25);
          --fino-text: #f0f0f5;
          --fino-muted: rgba(240,240,245,0.45);
        }

        .fino-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fino-nav-inner {
          margin: 0 auto;
          max-width: 1280px;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .fino-nav.scrolled {
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--fino-border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .fino-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .fino-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, var(--fino-accent) 0%, #00b37a 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 20px var(--fino-accent-glow);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }

        .fino-logo:hover .fino-logo-icon {
          box-shadow: 0 0 32px var(--fino-accent-glow);
          transform: scale(1.05) rotate(-3deg);
        }

        .fino-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: var(--fino-text);
          letter-spacing: -0.5px;
        }

        .fino-logo-text span { color: var(--fino-accent); }

        .fino-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0; padding: 0;
        }

        .fino-link-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--fino-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .fino-link-btn:hover {
          color: var(--fino-text);
          background: rgba(255,255,255,0.05);
        }

        .fino-link-btn.active {
          color: var(--fino-accent);
          background: var(--fino-accent-dim);
        }

        .fino-link-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 50%;
          transform: translateX(-50%);
          width: 20px; height: 2px;
          background: var(--fino-accent);
          border-radius: 2px;
          box-shadow: 0 0 8px var(--fino-accent);
        }

        .fino-badge {
          font-size: 9px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: linear-gradient(135deg, var(--fino-accent), #00b37a);
          color: #000;
          line-height: 1.4;
        }

        .fino-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .fino-greeting {
          font-size: 13px;
          color: var(--fino-muted);
          font-weight: 400;
        }

        .fino-greeting strong {
          color: var(--fino-text);
          font-weight: 500;
        }

        .fino-divider {
          width: 1px; height: 24px;
          background: var(--fino-border);
        }

        .fino-bell {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid var(--fino-border);
          background: var(--fino-surface);
          color: var(--fino-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .fino-bell:hover {
          color: var(--fino-text);
          border-color: rgba(255,255,255,0.15);
        }

        .fino-bell-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--fino-accent);
          box-shadow: 0 0 6px var(--fino-accent);
          border: 1.5px solid var(--fino-bg);
        }

        .fino-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid var(--fino-border);
          background: var(--fino-surface);
          font-size: 12px;
          font-weight: 500;
          color: var(--fino-muted);
        }

        .fino-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--fino-accent);
          box-shadow: 0 0 6px var(--fino-accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .fino-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          border: none;
          background: transparent;
        }

        .fino-hamburger span {
          display: block;
          width: 22px; height: 2px;
          background: var(--fino-muted);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .fino-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); background: var(--fino-text); }
        .fino-hamburger.open span:nth-child(2) { opacity: 0; }
        .fino-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); background: var(--fino-text); }

        .fino-mobile-menu {
          display: none;
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(10,10,15,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--fino-border);
          padding: 16px 24px 24px;
          flex-direction: column;
          gap: 4px;
          animation: slideDown 0.25s ease;
          z-index: 999;
        }

        .fino-mobile-menu.open { display: flex; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fino-mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: var(--fino-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .fino-mobile-link:hover,
        .fino-mobile-link.active {
          color: var(--fino-accent);
          background: var(--fino-accent-dim);
        }

        .fino-mobile-divider {
          height: 1px;
          background: var(--fino-border);
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .fino-links, .fino-greeting, .fino-divider, .fino-status { display: none; }
          .fino-hamburger { display: flex; }
        }

        .fino-spacer { height: 64px; }
      `}</style>

      <nav className={`fino-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="fino-nav-inner">

          <div className="fino-logo" onClick={() => navigate('/')}>
            <div className="fino-logo-icon">💰</div>
            <span className="fino-logo-text">FINO <span>AI</span></span>
          </div>

          <ul className="fino-links">
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <button
                  className={`fino-link-btn${isActive(link.path) ? ' active' : ''}`}
                  onClick={() => navigate(link.path)}
                >
                  {link.icon}
                  {link.label}
                  {link.badge && <span className="fino-badge">{link.badge}</span>}
                </button>
              </li>
            ))}
          </ul>

          <div className="fino-right">
            <div className="fino-status">
              <div className="fino-status-dot" />
              Live
            </div>
            <div className="fino-divider" />
            {user && (
              <span className="fino-greeting">
                Hey, <strong>{user.firstName || 'there'}</strong>
              </span>
            )}
            <button className="fino-bell" title="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="fino-bell-dot" />
            </button>
            <UserButton afterSignOutUrl="/" />
            <button
              className={`fino-hamburger${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`fino-mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <button
            key={link.path}
            className={`fino-mobile-link${isActive(link.path) ? ' active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.icon}
            {link.label}
            {link.badge && <span className="fino-badge">{link.badge}</span>}
          </button>
        ))}
        <div className="fino-mobile-divider" />
        {user && (
          <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--fino-muted)' }}>
            Signed in as <strong style={{ color: 'var(--fino-text)' }}>{user.primaryEmailAddress?.emailAddress}</strong>
          </span>
        )}
      </div>

      <div className="fino-spacer" />
    </>
  )
}