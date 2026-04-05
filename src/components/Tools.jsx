import { Outlet, useLocation } from 'react-router-dom';
import { toolsData } from '../data/toolsData';
import { ServiceCard } from './ui/service-card';

const CATEGORY_STYLE_MAP = {
  "Media Tools": { variant: "default", img: "https://images.unsplash.com/photo-1542038783-0ad457d2242e?q=80&w=320&auto=format&fit=crop" },
  "Image Conversion": { variant: "blue", img: "https://images.unsplash.com/photo-1452780212940-6f5c0c14d848?q=80&w=320&auto=format&fit=crop" },
  "Organize PDF": { variant: "red", img: "https://images.unsplash.com/photo-1544391496-0d77af2dd8ae?q=80&w=320&auto=format&fit=crop" },
  "Optimize PDF": { variant: "gray", img: "https://images.unsplash.com/photo-1504328156602-383033180681?q=80&w=320&auto=format&fit=crop" },
  "Convert to PDF": { variant: "primary", img: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=320&auto=format&fit=crop" },
  "Convert from PDF": { variant: "primary", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=320&auto=format&fit=crop" },
  "Edit PDF": { variant: "default", img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=320&auto=format&fit=crop" },
  "PDF Security": { variant: "gray", img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=320&auto=format&fit=crop" },
  "PDF Intelligence": { variant: "blue", img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=320&auto=format&fit=crop" }
};

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
            <div key={idx} className={`tools-category-section fade-in delay-${Math.min(idx + 1, 9)}`}>
              <h3 className="category-heading">{cat.category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.items.map((item, i) => {
                  const style = CATEGORY_STYLE_MAP[cat.category] || { variant: "default", img: "" };
                  return (
                    <ServiceCard
                      key={i}
                      title={item.name}
                      href={item.path}
                      imgSrc={style.img}
                      imgAlt={item.name}
                      variant={style.variant}
                      description={item.desc}
                      isNew={item.isNew}
                      className={item.comingSoon ? 'opacity-50 pointer-events-none' : ''}
                    />
                  );
                })}
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
