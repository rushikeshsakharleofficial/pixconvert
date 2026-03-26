import { Outlet, useLocation, Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const Tools = () => {
  const location = useLocation();
  const isToolsHome = location.pathname === '/tools' || location.pathname === '/tools/';

  if (isToolsHome) {
    return (
      <section>
        <div className="container">
          <h2 className="section-title fade-in visible">All PDF & Image Tools</h2>
          <p className="section-subtitle fade-in visible">Every tool you need to use PDFs and images, at your fingertips</p>
          
          {toolsData.map((cat, idx) => (
            <div key={idx} className="tools-category-section fade-in visible">
              <h3 className="category-heading">{cat.category}</h3>
              <div className="tool-cards-grid">
                {cat.items.map((item, i) => (
                  <Link key={i} to={item.path} className="tool-card" style={{ '--card-color': item.color }}>
                    <div className="tool-card-icon">{item.icon}</div>
                    <h3>{item.name} {item.isNew && <span className="badge badge-new">New</span>}</h3>
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

  // Find current tool info
  const allTools = toolsData.flatMap(c => c.items);
  const currentTool = allTools.find(t => location.pathname.endsWith(t.path.split('/').pop()));

  return (
    <section>
      <div className="container">
        <h2 className="section-title fade-in visible">
          {currentTool ? `${currentTool.icon} ${currentTool.name}` :
           location.pathname.includes('gif') ? '🎞️ GIF Maker' : 
           location.pathname.includes('pdf-lock') ? '🔐 PDF Locker' :
           location.pathname.includes('pdf') ? '🔓 PDF Unlocker' : 
           '🔄 Universal Converter'}
        </h2>
        <p className="section-subtitle fade-in visible">
          {currentTool?.desc || 'All processing happens right here in your browser — nothing is uploaded'}
        </p>
        <div className="glass fade-in visible" style={{ marginTop: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default Tools;
