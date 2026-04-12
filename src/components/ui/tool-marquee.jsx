import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../../data/toolsData";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "./card";

const ToolCard = ({ tool }) => (
  <Link
    to={tool.comingSoon ? '#' : tool.path}
    className="mx-4 w-64 shrink-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
  >
    <Card className="h-full border-slate-200 dark:border-border shadow-sm hover:shadow-md dark:shadow-black/40 transition-all duration-300 bg-card">
      <CardHeader className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="size-10 rounded-lg flex items-center justify-center text-xl relative"
          >
            <div 
              className="absolute inset-0 rounded-lg opacity-20"
              style={{ backgroundColor: tool.color || 'var(--primary)' }}
            />
            <span className="relative z-10">{tool.icon}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <CardTitle className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {tool.name}
            </CardTitle>
            {tool.isNew && (
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded w-fit font-bold uppercase tracking-wider mt-0.5">
                New
              </span>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-10">
          {tool.desc}
        </CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

function MarqueeRow({
  data,
  reverse = false,
  speed = 40,
}) {
  const doubled = React.useMemo(() => [...data, ...data], [data]);
  return (
    <div className="relative w-full overflow-hidden py-4">
      <div
        className="flex transform-gpu min-w-[200%]"
        style={{
          animation: `marqueeScroll ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((tool, i) => (
          <ToolCard key={`${tool.path}-${i}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export default function ToolMarquee() {
  // Flatten tools and split into two rows
  const allTools = toolsData.flatMap(cat => cat.items);
  const half = Math.ceil(allTools.length / 2);
  const row1 = allTools.slice(0, half);
  const row2 = allTools.slice(half);

  return (
    <div className="w-full mt-16 relative py-16 -mx-4 px-4">
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      {/* Faded edges - matched to the main theme background */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 md:w-48 z-10 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 md:w-48 z-10 bg-gradient-to-l from-background via-background/50 to-transparent" />

      <div className="flex flex-col gap-4">
        <MarqueeRow data={row1} reverse={false} speed={50} />
        <MarqueeRow data={row2} reverse={true} speed={60} />
      </div>
    </div>
  );
}
