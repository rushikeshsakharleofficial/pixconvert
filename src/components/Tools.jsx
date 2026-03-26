import { Outlet, useLocation, Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const Tools = () => {
  const location = useLocation();
  const isToolsHome = location.pathname === '/tools' || location.pathname === '/tools/';

  if (isToolsHome) {
    return (
      <section>
        <div className="container">
          <h2 className="section-title fade-in">All PDF &amp; Image Tools</h2>
          <p className="section-subtitle fade-in delay-1">Every tool you need, running entirely in your browser</p>

          {toolsData.map((cat, idx) => (
            <div key={idx} className="tools-category-section fade-in" style={{ animationDelay: `${idx * 0.04}s` }}>
              <h3 className="category-heading">{cat.category}</h3>
              <div className="tool-cards-grid">
                {cat.items.map((item, i) => (
                  <Link
                    key={i}
                    to={item.path}
                    className={`tool-card${item.comingSoon ? ' coming-soon' : ''}`}
                    style={{ '--card-color': item.color }}
                    onClick={item.comingSoon ? undefined : undefined}
                  >
                    <div className="tool-card-icon">{item.icon}</div>
                    <h3>
                      {item.name}
                      {item.isNew && <span className="badge badge-new">New</span>}
                    </h3>
                    <p>{item.desc}</p>
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
        <h2 className="section-title fade-in">{title}</h2>
        <p className="section-subtitle fade-in delay-1">{subtitle}</p>
        <div className="glass fade-in delay-2" style={{ marginTop: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default Tools;
