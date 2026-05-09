"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#34d399";
  if (score >= 40) return "#fbbf24";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Needs Work";
  return "Critical";
}

export function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle className="score-ring-track" cx="50" cy="50" r={radius} />
          <circle
            className="score-ring-value"
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums text-white">{score}</span>
          <span className="text-xs font-semibold text-stone-400">/100</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-bold text-stone-300">{label}</span>
      </div>
    </div>
  );
}
