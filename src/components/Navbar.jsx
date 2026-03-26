import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { toolsData } from '../data/toolsData';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeMenu = () => { setMenuOpen(false); setMegaOpen(false); setMobileToolsOpen(false); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" onClick={closeMenu}>
        <svg viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="24" height="24" rx="6" stroke="#e5322d" strokeWidth="2"/><path d="M8 20l4-6 3 4 2-3 3 5" stroke="#e5322d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="10" r="2" fill="#e5322d"/></svg>
        PixConvert
      </Link>

      {/* Desktop Nav */}
      <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
        <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu} end>Home</NavLink></li>

        {/* Desktop mega-menu */}
        <li className="nav-dropdown desktop-only" ref={dropdownRef}
            onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
          <span className="nav-dropdown-trigger" onClick={() => setMegaOpen(!megaOpen)}>
            All Tools ▾
          </span>
          <div className={`mega-menu${megaOpen ? ' open' : ''}`}>
            {toolsData.map((cat, idx) => (
              <div key={idx} className="mega-menu-column">
                <h4>{cat.category}</h4>
                {cat.items.map((item, i) => (
                  <NavLink key={i} to={item.path} className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                    <span className="mega-icon">{item.icon}</span> {item.name}
                    {item.isNew && <span className="badge badge-new">New</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </li>

        {/* Mobile tools accordion */}
        <li className="mobile-only">
          <button className="mobile-tools-toggle" onClick={() => setMobileToolsOpen(!mobileToolsOpen)}>
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
                      {item.isNew && <span className="badge badge-new" style={{marginLeft: 'auto'}}>New</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          )}
        </li>

        <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>About</NavLink></li>
        <li><NavLink to="/privacy" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Privacy</NavLink></li>
        <li><NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Contact</NavLink></li>
      </ul>
      <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <span/><span/><span/>
      </button>
    </nav>
  );
};

export default Navbar;
