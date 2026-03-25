import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" onClick={closeMenu}>
        <svg viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="24" height="24" rx="6" stroke="#14f0d5" strokeWidth="2"/><path d="M8 20l4-6 3 4 2-3 3 5" stroke="#14f0d5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="10" r="2" fill="#14f0d5"/></svg>
        PixConvert
      </Link>
      <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
        {[['/','Home'],['/tools','Tools'],['/about','About'],['/privacy','Privacy'],['/contact','Contact']].map(([path,label]) => {
          if (label === 'Tools') {
            return (
              <li key={path} className="nav-dropdown">
                <span className="nav-dropdown-trigger">Tools ▾</span>
                <div className="nav-dropdown-menu">
                  <NavLink to="/tools/converter" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>🔄 Universal Converter</NavLink>
                  <NavLink to="/tools/gif" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>🎞️ GIF Maker</NavLink>
                </div>
              </li>
            );
          }
          return (
            <li key={path}>
              <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu} end={path === '/'}>
                {label}
              </NavLink>
            </li>
          );
        })}
      </ul>
      <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <span/><span/><span/>
      </button>
    </nav>
  );
};

export default Navbar;
