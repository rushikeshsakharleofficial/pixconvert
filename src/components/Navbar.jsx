import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import { toolsData } from '../data/toolsData';
import { DropdownNavigation } from './ui/dropdown-navigation';
import { 
  Wrench, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Scissors, 
  Trash2, 
  FilePlus, 
  Layout, 
  Maximize, 
  FileSearch,
  Image as ImageIcon,
  FileDigit,
  Globe,
  Lock,
  RotateCcw,
  Hash,
  Stamp,
  Crop,
  Edit3
} from 'lucide-react';

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

// Map toolsData categories to logical groups for the mega menu
const CATEGORY_MAP = {
  "Organize PDF": "Management",
  "Optimize PDF": "Management",
  "PDF Security": "Management",
  "Convert to PDF": "Conversion",
  "Convert from PDF": "Conversion",
  "Image Conversion": "Media & Edit",
  "Edit PDF": "Media & Edit",
  "Media Tools": "Media & Edit",
  "PDF Intelligence": "Media & Edit"
};

const ICON_MAP = {
  "Merge PDF": Layers,
  "Split PDF": Scissors,
  "Remove Pages": Trash2,
  "Extract Pages": FilePlus,
  "Organize PDF": Layout,
  "Scan to PDF": Maximize,
  "Compress PDF": Maximize,
  "Repair PDF": Wrench,
  "OCR PDF": FileSearch,
  "Universal Converter": RefreshCw,
  "GIF Maker": ImageIcon,
  "JPG to PDF": ImageIcon,
  "WORD to PDF": FileText,
  "POWERPOINT to PDF": Layout,
  "EXCEL to PDF": FileDigit,
  "HTML to PDF": Globe,
  "Unlock PDF": Lock,
  "Protect PDF": ShieldCheck,
  "Rotate PDF": RotateCcw,
  "Add Page Numbers": Hash,
  "Add Watermark": Stamp,
  "Crop PDF": Crop,
  "Edit PDF": Edit3
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return (localStorage.getItem(THEME_KEY) ?? 'dark') !== 'light';
    } catch { return true; }
  });

  const closeMenu = () => {
    setMenuOpen(false);
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navItems = useMemo(() => {
    const toolsNavItem = {
      id: 2,
      label: "Tools",
      subMenus: [
        { title: "Management", items: [] },
        { title: "Conversion", items: [] },
        { title: "Media & Edit", items: [] }
      ]
    };

    toolsData.forEach(cat => {
      const groupName = CATEGORY_MAP[cat.category] || "Media & Edit";
      const targetSubMenu = toolsNavItem.subMenus.find(s => s.title === groupName);
      
      cat.items.filter(i => !i.comingSoon).forEach(item => {
        targetSubMenu.items.push({
          label: item.name,
          description: item.desc,
          path: item.path,
          icon: ICON_MAP[item.name] || item.icon,
          isNew: item.isNew
        });
      });
    });

    // Limit items per submenu to prevent too much height
    toolsNavItem.subMenus.forEach(subMenu => {
      subMenu.items = subMenu.items.slice(0, 8);
    });

    return [
      { id: 1, label: "Home", link: "/" },
      toolsNavItem,
      { id: 3, label: "About", link: "/about" },
      { id: 4, label: "Privacy", link: "/privacy" },
      { id: 5, label: "Contact", link: "/contact" }
    ];
  }, []);

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

        {/* Desktop Navigation */}
        <div className="desktop-only">
          <DropdownNavigation navItems={navItems} />
        </div>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          {/* Mobile links only since desktop is handled by DropdownNavigation */}
          <li className="mobile-only">
            <NavLink to="/" end onClick={closeMenu}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Home
            </NavLink>
          </li>

          {/* Mobile tools accordion */}
          <li className="mobile-only">
            <button className="mobile-tools-toggle"
              onClick={() => setMobileToolsOpen(o => !o)}
              aria-expanded={mobileToolsOpen}>
              Tools {mobileToolsOpen ? '▴' : '▾'}
            </button>
            {mobileToolsOpen && (
              <div className="mobile-tools-list">
                {/* Popular quick links on mobile */}
                <div className="mobile-tools-popular">
                  {[
                    { icon: '🔄', name: 'Converter', path: '/tools/converter' },
                    { icon: '📁', name: 'Merge PDF', path: '/tools/merge-pdf' },
                    { icon: '✂️', name: 'Split PDF', path: '/tools/split-pdf' },
                    { icon: '🔓', name: 'Unlock PDF', path: '/tools/pdf' },
                    { icon: '🖼️', name: 'PDF → JPG', path: '/tools/pdf-to-jpg' },
                    { icon: '🎞️', name: 'GIF Maker', path: '/tools/gif' },
                  ].map(t => (
                    <NavLink key={t.path} to={t.path} onClick={closeMenu} className="mobile-popular-pill">
                      {t.icon} {t.name}
                    </NavLink>
                  ))}
                </div>
                {toolsData.map((cat) => {
                  const active = cat.items.filter(i => !i.comingSoon);
                  if (!active.length) return null;
                  return (
                    <div key={cat.category} className="mobile-tools-cat">
                      <h4>{cat.category}</h4>
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
            <NavLink to="/about" onClick={closeMenu}
              className={({ isActive }) => isActive ? 'active' : ''}>
              About
            </NavLink>
          </li>
          <li className="mobile-only">
            <NavLink to="/privacy" onClick={closeMenu}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Privacy
            </NavLink>
          </li>
          <li className="mobile-only">
            <NavLink to="/contact" onClick={closeMenu}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Contact
            </NavLink>
          </li>
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