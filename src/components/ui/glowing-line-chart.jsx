"use client";

import { useState, useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card.jsx";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./line-chart.jsx";
import { Badge } from "./badge.jsx";

export function GlowingLineChart({ data, config, title, description, trending }) {
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimate(false));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <Card className="glass border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
          {title || "Files Processed"}
          {trending && (
            <Badge
              variant="outline"
              className="text-green-500 bg-green-500/10 border-none ml-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>{trending}</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description || "Usage trends"}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={config} className="h-[300px] w-full min-h-[300px]" role="img" aria-label={`${title || 'Files Processed'} line chart`}>
          <LineChart
            data={data}
            margin={{
              left: 20,
              right: 20,
              top: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} strokeOpacity={0.2} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {Object.keys(config).map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={config[key].color}
                dot={{ r: 4, fill: config[key].color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                strokeWidth={3}
                connectNulls={true}
                filter="url(#rainbow-line-glow)"
                isAnimationActive={animate}
              />
            ))}
            <defs>
              <filter
                id="rainbow-line-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
