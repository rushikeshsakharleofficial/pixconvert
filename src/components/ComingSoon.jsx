import { useLocation, Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const ComingSoon = () => {
  const location = useLocation();
  const allTools = toolsData.flatMap(c => c.items);
  const currentTool = allTools.find(t => location.pathname === t.path);
  const color = currentTool?.color || '#e5322d';
  const toolName = currentTool?.name || 'Tool';

  return (
    <div className="coming-soon-page" style={{ '--tool-color': color }}>
      <div className="cs-glow" aria-hidden="true" />
      <div className="cs-glow cs-glow-2" aria-hidden="true" />
      <div className="cs-content">
        <div className="cs-icon-ring" aria-hidden="true">
          <span className="cs-icon">{currentTool?.icon || '🛠️'}</span>
        </div>
        <h1>{toolName} — Coming Soon</h1>
        <p className="cs-desc">{currentTool?.desc || 'This tool is being developed.'}</p>
        <div className="cs-badge" aria-hidden="true">✨ Coming Soon</div>
        <p className="cs-sub">Some tools are coming soon. We're crafting this tool with care.</p>
        <div className="cs-actions">
          <Link
            to="/"
            className="btn btn-outline"
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
          >
            ⌂ Go Home
          </Link>
          <Link
            to="/tools"
            className="btn btn-primary"
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
          >
            Browse All Tools →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
