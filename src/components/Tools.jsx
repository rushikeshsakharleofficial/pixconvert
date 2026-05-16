import { Outlet, useLocation, Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const Tools = () => {
  const location = useLocation();
  const isToolsHome = location.pathname === '/tools' || location.pathname === '/tools/';

  if (isToolsHome) {
    return (
      <section>
        <div className="container">
          <h1 className="section-title fade-in">All PDF &amp; Image Tools</h1>
          <p className="section-subtitle fade-in delay-1">Every tool you need, running entirely in your browser</p>

          {toolsData.map((cat, idx) => (
            <div key={idx} className={`tools-category-section fade-in delay-${Math.min(idx + 1, 9)}`}>
              <h2 className="category-heading">{cat.category}</h2>
              <div className="tool-cards-grid">
                {cat.items.map((item, i) => (
                  <Link
                    key={i}
                    to={item.comingSoon ? '#' : item.path}
                    className={`tool-card ${item.comingSoon ? 'coming-soon' : ''}`}
                    style={{ "--card-color": item.color || "var(--primary)" }}
                  >
                    <div className="tool-card-icon" aria-hidden="true">{item.icon}</div>
                    <h3>
                      {item.name}
                      {item.isNew && <span className="badge badge-new">New</span>}
                    </h3>
                    <p>{item.desc}</p>
                    {!item.comingSoon && (
                      <span className="tool-card-cta">
                        {item.name.includes('Convert') ? 'Convert file' : 'Use Tool'} <span className="arrow">→</span>
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Individual tool page
  const allTools = toolsData.flatMap(c => c.items);
  const currentTool = allTools.find(t => location.pathname.endsWith(t.path.split('/').pop()));

  const title = currentTool
    ? `${currentTool.icon} ${currentTool.name}`
    : location.pathname.includes('gif') ? '🎞️ GIF Maker'
    : location.pathname.includes('pdf-lock') ? '🔐 PDF Locker'
    : location.pathname.includes('pdf') ? '🔓 PDF Unlocker'
    : '🔄 Universal Converter';

  const subtitle = currentTool?.desc || 'All processing happens right here in your browser — nothing is uploaded';

  return (
    <section>
      <div className="container">
        <h1 className="section-title fade-in">{title}</h1>
        <p className="section-subtitle fade-in delay-1">{subtitle}</p>
        <div className="glass fade-in delay-2" style={{ marginTop: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default Tools;