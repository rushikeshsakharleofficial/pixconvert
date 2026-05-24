import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../../data/toolsData";

/* ── Single tool chip ── */
const ToolChip = ({ tool, isDuplicate = false }) => (
  <Link
    to={tool.comingSoon ? '#' : tool.path}
    className="tool-chip"
    style={{ '--chip-color': tool.color || 'var(--primary)' }}
    aria-hidden={isDuplicate ? 'true' : undefined}
    tabIndex={isDuplicate ? -1 : undefined}
    title={tool.name}
  >
    <span className="tool-chip-icon-wrap" aria-hidden="true">
      <span className="tool-chip-icon">{tool.icon}</span>
    </span>
    <span className="tool-chip-name">{tool.name}</span>
    {tool.comingSoon && <span className="tool-chip-soon" aria-hidden="true">Soon</span>}
  </Link>
);

/* ── Single marquee row ── */
function MarqueeRow({ data, reverse = false, speed = 44 }) {
  const doubled = React.useMemo(() => [...data, ...data], [data]);
  return (
    <div className="marquee-row-wrap">
      <div
        className="marquee-row-track"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {doubled.map((tool, i) => (
          <ToolChip
            key={`${tool.path}-${i}`}
            tool={tool}
            isDuplicate={i >= data.length}
          />
        ))}
      </div>
    </div>
  );
}

/* ── ToolMarquee ── */
export default function ToolMarquee() {
  const allTools = toolsData.flatMap(cat => cat.items);
  const half = Math.ceil(allTools.length / 2);
  const row1 = allTools.slice(0, half);
  const row2 = allTools.slice(half);

  return (
    <div className="marquee-section">
      {/* Edge fade masks */}
      <div className="marquee-fade marquee-fade--left"  aria-hidden="true" />
      <div className="marquee-fade marquee-fade--right" aria-hidden="true" />

      <div className="marquee-rows">
        <MarqueeRow data={row1} reverse={false} speed={48} />
        <MarqueeRow data={row2} reverse={true}  speed={60} />
      </div>
    </div>
  );
}
