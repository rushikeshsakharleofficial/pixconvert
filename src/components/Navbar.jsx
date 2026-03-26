import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { toolsData } from '../data/toolsData';

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const THEME_KEY = 'pixconvert-theme';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return (localStorage.getItem(THEME_KEY) ?? 'dark') !== 'light';
    } catch { return true; }
  });
  const dropdownRef = useRef(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setMegaOpen(false);
    setMobileToolsOpen(false);
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  // Apply theme on mount
  useEffect(() => {
    const saved = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
    const theme = saved ?? 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    setIsDark(theme !== 'light');
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`nav-overlay${menuOpen ? ' active' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#ef4444" strokeWidth="1.8"/>
            <path d="M8 20l4-6 3 4 2-3 3 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="10" r="2" fill="#ef4444"/>
          </svg>
          Pix<span className="logo-mark">Convert</span>
        </Link>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          <li>
            <NavLink to="/" end onClick={closeMenu}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Home
            </NavLink>
          </li>

          {/* Desktop mega-menu */}
          <li className="nav-dropdown desktop-only" ref={dropdownRef}
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}>
            <span className="nav-dropdown-trigger"
              onClick={() => setMegaOpen(o => !o)}
              aria-expanded={megaOpen}>
              All Tools ▾
            </span>
            <div className={`mega-menu${megaOpen ? ' open' : ''}`}>
              {toolsData.map((cat, idx) => (
                <div key={idx} className="mega-menu-column">
                  <h4>{cat.category}</h4>
                  {cat.items.map((item, i) => (
                    <NavLink key={i} to={item.path} onClick={closeMenu}
                      className={({ isActive }) => isActive ? 'active' : ''}>
                      <span className="mega-icon">{item.icon}</span>
                      {item.name}
                      {item.isNew && <span className="badge badge-new">New</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          </li>

          {/* Mobile tools accordion */}
          <li className="mobile-only">
            <button className="mobile-tools-toggle"
              onClick={() => setMobileToolsOpen(o => !o)}
              aria-expanded={mobileToolsOpen}>
              All Tools {mobileToolsOpen ? '▴' : '▾'}
            </button>
            {mobileToolsOpen && (
              <div className="mobile-tools-list">
                {toolsData.map((cat, idx) => (
                  <div key={idx} className="mobile-tools-cat">
                    <h4>{cat.category}</h4>
                    {cat.items.map((item, i) => (
                      <NavLink key={i} to={item.path} onClick={closeMenu}>
                        {item.icon} {item.name}
                        {item.isNew && <span className="badge badge-new" style={{ marginLeft: 'auto' }}>New</span>}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </li>

          <li><NavLink to="/about"   onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink></li>
          <li><NavLink to="/privacy" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Privacy</NavLink></li>
          <li><NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Contact</NavLink></li>
          <li><NavLink to="/blog"    onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Blog</NavLink></li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}>
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
