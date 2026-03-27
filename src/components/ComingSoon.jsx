import { useLocation, Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const ComingSoon = () => {
  const location = useLocation();
  const allTools = toolsData.flatMap(c => c.items);
  const currentTool = allTools.find(t => location.pathname === t.path);
  const color = currentTool?.color || '#e5322d';

  return (
    <div className="coming-soon-page" style={{ '--tool-color': color }}>
      <div className="cs-glow" />
      <div className="cs-glow cs-glow-2" />
      <div className="cs-content">
        <div className="cs-icon-ring">
          <span className="cs-icon">{currentTool?.icon || '🛠️'}</span>
        </div>
        <h2>{currentTool?.name || 'Tool'}</h2>
        <p className="cs-desc">{currentTool?.desc || 'This tool is being developed.'}</p>
        <div className="cs-badge">✨ Coming Soon</div>
        <p className="cs-sub">Some tools are coming soon. We're crafting this tool with care.</p>
        <div className="cs-actions">
          <Link to="/" className="btn btn-outline">⌂ Go Home</Link>
          <Link to="/tools" className="btn btn-primary">Browse All Tools →</Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
