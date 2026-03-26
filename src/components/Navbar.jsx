import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { toolsData } from '../data/toolsData';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef(null);
  const triggerRef = useRef(null);
  const closeMenu = () => { setMenuOpen(false); setMegaOpen(false); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
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
      <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
        <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu} end>Home</NavLink></li>
        <li className="nav-dropdown">
          <span
            ref={triggerRef}
            className="nav-dropdown-trigger"
            onClick={() => setMegaOpen(!megaOpen)}
            onMouseEnter={() => setMegaOpen(true)}
          >
            All Tools ▾
          </span>
          <div
            ref={megaRef}
            className={`mega-menu${megaOpen ? ' open' : ''}`}
            onMouseLeave={() => setMegaOpen(false)}
          >
            {toolsData.map((cat, idx) => (
              <div key={idx} className="mega-menu-column">
                <h4>{cat.category}</h4>
                {cat.items.map((item, i) => (
                  <NavLink key={i} to={item.path} className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                    <span className="mega-icon">{item.icon}</span> {item.name}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
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
