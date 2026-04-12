import { useEffect, useMemo, useState } from 'react';

const DEFAULT_STATUSES = ['Uploading', 'Parsing', 'Processing', 'Syncing', 'Preparing', 'Placing'];

export const PrismFluxLoader = ({
  size = 30,
  speed = 5,
  textSize = 13,
  statuses = DEFAULT_STATUSES,
}) => {
  const [time, setTime] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const items = useMemo(() => (statuses.length ? statuses.slice(0, 6) : DEFAULT_STATUSES), [statuses]);

  useEffect(() => {
    const startTime = Date.now();
    let frame;
    const update = () => {
      setTime(Date.now() - startTime);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % items.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative" style={{ width: size * 2, height: size * 2 }}>
        <div className="absolute inset-0 animate-spin flex items-center justify-center">
           <span className="text-primary text-2xl font-bold">⬡</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-foreground font-semibold" style={{ fontSize: textSize }}>
          {items[statusIndex]}...
        </span>
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((statusIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrismFluxLoader;
