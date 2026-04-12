import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toolsData } from '../data/toolsData';

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const THEME_KEY = 'pixconvert-theme';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return (localStorage.getItem(THEME_KEY) ?? 'dark') !== 'light';
    } catch {
      return true;
    }
  });

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileToolsOpen(false);
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    })();
    const theme = saved ?? 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <div
        className={`nav-overlay${menuOpen ? ' active' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <svg viewBox="0 0 28 28" fill="none" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#FF4F00" strokeWidth="2.5"/>
            <path d="M8 20l4-6 3 4 2-3 3 5" stroke="#FF4F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="10" r="2" fill="#FF4F00"/>
          </svg>
          Pix<span className="logo-mark">Convert</span>
        </Link>

        <div className="nav-center">
          <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
            <li className="desktop-only">
              <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
            </li>

            <li className="nav-dropdown desktop-only">
              <span className="nav-dropdown-trigger">Tools ▾</span>
              <div className="tools-dropdown">
                <div className="tools-dd-popular">
                  <span className="tools-dd-popular-label">Popular</span>
                  <div className="tools-dd-popular-grid">
                    <Link to="/tools/converter" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">🔄</span> Converter
                    </Link>
                    <Link to="/tools/merge-pdf" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">📁</span> Merge PDF
                    </Link>
                    <Link to="/tools/split-pdf" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">✂️</span> Split PDF
                    </Link>
                    <Link to="/tools/pdf" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">🔓</span> Unlock PDF
                    </Link>
                    <Link to="/tools/pdf-to-jpg" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">🖼️</span> PDF → JPG
                    </Link>
                    <Link to="/tools/gif" className="tools-dd-pill" onClick={closeMenu}>
                      <span className="tdi-icon">🎞️</span> GIF Maker
                    </Link>
                  </div>
                </div>

                <div className="tools-dropdown-grid">
                  {toolsData.map((category, index) => {
                    const active = category.items.filter((item) => !item.comingSoon);
                    if (!active.length) return null;

                    return (
                      <div key={index} className="tools-dropdown-group">
                        <span className="tools-dropdown-label">{category.category}</span>
                        {active.map((item) => (
                          <Link key={item.path} to={item.path} className="tools-dropdown-item" onClick={closeMenu}>
                            <span className="tdi-icon">{item.icon}</span>
                            <span className="tdi-name">
                              {item.name}
                              {item.isNew && <span className="badge badge-new">New</span>}
                            </span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="tools-dropdown-footer">
                  <Link to="/tools" className="tools-dropdown-browse" onClick={closeMenu}>Browse all tools →</Link>
                </div>
              </div>
            </li>

            <li className="desktop-only">
              <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>About</NavLink>
            </li>
            <li className="desktop-only">
              <NavLink to="/privacy" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Privacy</NavLink>
            </li>
            <li className="desktop-only">
              <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink>
            </li>

            <li className="mobile-only">
              <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
            </li>
            <li className="mobile-only">
              <button
                className="mobile-tools-toggle"
                onClick={() => setMobileToolsOpen((open) => !open)}
                aria-expanded={mobileToolsOpen}
              >
                Tools {mobileToolsOpen ? '▴' : '▾'}
              </button>
              {mobileToolsOpen && (
                <div className="mobile-tools-list">
                  <div className="mobile-tools-popular">
                    {[
                      { icon: '🔄', name: 'Converter', path: '/tools/converter' },
                      { icon: '📁', name: 'Merge PDF', path: '/tools/merge-pdf' },
                      { icon: '✂️', name: 'Split PDF', path: '/tools/split-pdf' },
                      { icon: '🔓', name: 'Unlock PDF', path: '/tools/pdf' },
                      { icon: '🖼️', name: 'PDF → JPG', path: '/tools/pdf-to-jpg' },
                      { icon: '🎞️', name: 'GIF Maker', path: '/tools/gif' },
                    ].map((tool) => (
                      <NavLink key={tool.path} to={tool.path} onClick={closeMenu} className="mobile-popular-pill">
                        {tool.icon} {tool.name}
                      </NavLink>
                    ))}
                  </div>
                  {toolsData.map((category) => {
                    const active = category.items.filter((item) => !item.comingSoon);
                    if (!active.length) return null;
                    return (
                      <div key={category.category} className="mobile-tools-cat">
                        <h4>{category.category}</h4>
                        {active.map((item) => (
                          <NavLink key={item.path} to={item.path} onClick={closeMenu}>
                            {item.icon} {item.name}
                            {item.isNew && <span className="badge badge-new" style={{ marginLeft: 'auto' }}>New</span>}
                          </NavLink>
                        ))}
                      </div>
                    );
                  })}
                  <Link to="/tools" onClick={closeMenu} className="mobile-browse-all">
                    Browse all tools →
                  </Link>
                </div>
              )}
            </li>

            <li className="mobile-only">
              <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>About</NavLink>
            </li>
            <li className="mobile-only">
              <NavLink to="/privacy" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Privacy</NavLink>
            </li>
            <li className="mobile-only">
              <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink>
            </li>
          </ul>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
