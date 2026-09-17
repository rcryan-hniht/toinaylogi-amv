'use client';

import React from 'react';
import type { ActressRatings } from '@/lib/actresses';
import type { copy, Language } from '@/lib/i18n';

type Props = {
  ratings: ActressRatings;
  t: (typeof copy)[Language];
};

const MIN_SCORE = 2.5;
const MAX_SCORE = 5.0;
const SCORE_RANGE = MAX_SCORE - MIN_SCORE; // 2.5

function getStatData(rawScore: number | undefined, name: string) {
  if (rawScore === undefined || Number.isNaN(rawScore)) {
    return {
      name,
      raw: undefined,
      val5: undefined,
      displayVal: '—',
      ratio: 0,
    };
  }
  const val5 = rawScore / 2;
  const ratio = Math.max(0, Math.min(1, (val5 - MIN_SCORE) / SCORE_RANGE));
  return {
    name,
    raw: rawScore,
    val5,
    displayVal: val5.toFixed(1),
    ratio,
  };
}

export function CharacterStatsRadar({ ratings, t }: Props) {
  // 4 stats: Looks, Body, Erotic Appeal, Charm
  // Diamond orientation:
  // Top: Looks (Gương mặt / Looks)
  // Right: Body (Vóc dáng / Body)
  // Bottom: Erotic Appeal (Đảm đang / Appeal)
  // Left: Charm (Diễn xuất / Charm)
  const looks = getStatData(ratings.looks, t.looksScore);
  const body = getStatData(ratings.body, t.bodyScore);
  const eroticAppeal = getStatData(ratings.eroticAppeal, t.eroticAppealScore);
  const charm = getStatData(ratings.charm, t.charmScore);

  const stats = [looks, body, eroticAppeal, charm];

  // SVG Geometry
  const width = 340;
  const height = 240;
  const cx = width / 2; // 170
  const cy = height / 2; // 120
  const radius = 76; // outer boundary radius representing score = 5.0
  const midRadius = radius * 0.5; // midpoint radius representing score = 3.75

  // Outer polygon vertices (at radius, score = 5.0)
  const outerTop = { x: cx, y: cy - radius };
  const outerRight = { x: cx + radius, y: cy };
  const outerBottom = { x: cx, y: cy + radius };
  const outerLeft = { x: cx - radius, y: cy };
  const outerPointsStr = `${outerTop.x},${outerTop.y} ${outerRight.x},${outerRight.y} ${outerBottom.x},${outerBottom.y} ${outerLeft.x},${outerLeft.y}`;

  // Midpoint guide polygon vertices (score = 3.75)
  const midTop = { x: cx, y: cy - midRadius };
  const midRight = { x: cx + midRadius, y: cy };
  const midBottom = { x: cx, y: cy + midRadius };
  const midLeft = { x: cx - midRadius, y: cy };
  const midPointsStr = `${midTop.x},${midTop.y} ${midRight.x},${midRight.y} ${midBottom.x},${midBottom.y} ${midLeft.x},${midLeft.y}`;

  // Data polygon vertices (normalized by ratio, origin = 2.5)
  const dataTop = { x: cx, y: cy - looks.ratio * radius };
  const dataRight = { x: cx + body.ratio * radius, y: cy };
  const dataBottom = { x: cx, y: cy + eroticAppeal.ratio * radius };
  const dataLeft = { x: cx - charm.ratio * radius, y: cy };
  const dataPoints = [dataTop, dataRight, dataBottom, dataLeft];
  const dataPointsStr = `${dataTop.x},${dataTop.y} ${dataRight.x},${dataRight.y} ${dataBottom.x},${dataBottom.y} ${dataLeft.x},${dataLeft.y}`;

  const tooltipSummary = stats
    .map(
      (s) =>
        `${s.name}: ${s.displayVal}/5.0${s.raw !== undefined ? ` (${s.raw.toFixed(2)}/10)` : ''}`,
    )
    .join(' · ');

  return (
    <div className="character-stats-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="character-stats-svg"
        role="img"
        aria-label={tooltipSummary}
      >
        <defs>
          <radialGradient
            id="charStatsBg"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#1a262d" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0f171c" stopOpacity="0.9" />
          </radialGradient>

          <linearGradient
            id="charStatsFill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.22" />
          </linearGradient>

          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor="#f59e0b"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        {/* Outer diamond background */}
        <polygon
          points={outerPointsStr}
          fill="url(#charStatsBg)"
          stroke="#2e414c"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Midpoint guide diamond (3.75) */}
        <polygon
          points={midPointsStr}
          fill="none"
          stroke="#22333c"
          strokeWidth="1"
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />

        {/* Spoke lines from center to outer vertices */}
        <line
          x1={outerTop.x}
          y1={outerTop.y}
          x2={outerBottom.x}
          y2={outerBottom.y}
          stroke="#273a45"
          strokeWidth="1.2"
        />
        <line
          x1={outerLeft.x}
          y1={outerLeft.y}
          x2={outerRight.x}
          y2={outerRight.y}
          stroke="#273a45"
          strokeWidth="1.2"
        />

        {/* Character Stat Data Polygon */}
        <polygon
          points={dataPointsStr}
          fill="url(#charStatsFill)"
          stroke="#f1a83b"
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#radarGlow)"
        >
          <title>{tooltipSummary}</title>
        </polygon>

        {/* Active data point vertices */}
        {dataPoints.map((pt, i) => {
          const stat = stats[i];
          if (stat.ratio <= 0) return null;
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="#f1a83b"
              stroke="#10191e"
              strokeWidth="1.5"
            >
              <title>{`${stat.name}: ${stat.displayVal}/5.0`}</title>
            </circle>
          );
        })}

        {/* Origin indicator (2.5) */}
        <circle cx={cx} cy={cy} r="2.5" fill="#4d6573"></circle>

        {/* --- LABELS --- */}
        {/* Top: Looks */}
        <g className="character-stat-group stat-top">
          <text
            x={cx}
            y={outerTop.y - 18}
            textAnchor="middle"
            className="character-stat-text-name"
          >
            {looks.name}
          </text>
          <text
            x={cx}
            y={outerTop.y - 5}
            textAnchor="middle"
            className="character-stat-text-score"
          >
            {looks.displayVal}
          </text>
        </g>

        {/* Right: Body */}
        <g className="character-stat-group stat-right">
          <text
            x={outerRight.x + 12}
            y={cy - 4}
            textAnchor="start"
            className="character-stat-text-name"
          >
            {body.name}
          </text>
          <text
            x={outerRight.x + 12}
            y={cy + 12}
            textAnchor="start"
            className="character-stat-text-score"
          >
            {body.displayVal}
          </text>
        </g>

        {/* Bottom: Erotic Appeal */}
        <g className="character-stat-group stat-bottom">
          <text
            x={cx}
            y={outerBottom.y + 17}
            textAnchor="middle"
            className="character-stat-text-score"
          >
            {eroticAppeal.displayVal}
          </text>
          <text
            x={cx}
            y={outerBottom.y + 31}
            textAnchor="middle"
            className="character-stat-text-name"
          >
            {eroticAppeal.name}
          </text>
        </g>

        {/* Left: Charm */}
        <g className="character-stat-group stat-left">
          <text
            x={outerLeft.x - 12}
            y={cy - 4}
            textAnchor="end"
            className="character-stat-text-name"
          >
            {charm.name}
          </text>
          <text
            x={outerLeft.x - 12}
            y={cy + 12}
            textAnchor="end"
            className="character-stat-text-score"
          >
            {charm.displayVal}
          </text>
        </g>
      </svg>
    </div>
  );
}
