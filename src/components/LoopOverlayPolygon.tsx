import { useId } from 'react';
import { LoopStep } from '../types/transportation';
import { LoopPalette, LOOP_PALETTES } from '../utils/loopPalettes';

export interface CellPosition {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LoopOverlayPolygonProps {
  loop: LoopStep[] | null;
  cellPositions: Map<string, CellPosition>;
  containerWidth: number;
  containerHeight: number;
  palette?: LoopPalette;
  enteringCellCoord?: { row: number; col: number } | null;
}

export default function LoopOverlayPolygon({
  loop,
  cellPositions,
  containerWidth,
  containerHeight,
  palette = LOOP_PALETTES[0], // default to first palette
  enteringCellCoord,
}: LoopOverlayPolygonProps) {
  const gradientId = useId();
  const markerArrowId = useId();

  if (!loop || loop.length < 4 || containerWidth <= 0 || containerHeight <= 0) {
    return null;
  }

  // Map each step to pixel coordinates (center of the corresponding cell)
  const points: {
    x: number;
    y: number;
    row: number;
    col: number;
    sign: '+' | '-';
    index: number;
    cost: number;
    amount: number | null;
  }[] = [];

  for (let i = 0; i < loop.length; i++) {
    const step = loop[i];
    const key = `${step.row}-${step.col}`;
    const pos = cellPositions.get(key);
    if (!pos) {
      // Incomplete coordinates mapping, cannot safely draw SVG
      return null;
    }
    points.push({
      x: pos.x + pos.width / 2,
      y: pos.y + pos.height / 2,
      row: step.row,
      col: step.col,
      sign: step.sign,
      index: i + 1,
      cost: step.cost,
      amount: step.allocation,
    });
  }

  // Create SVG polygon points string (e.g. "x1,y1 x2,y2 x3,y3 ...")
  const polygonPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // SVG closed path data string with explicit line segments
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }
  pathD += ' Z';

  const strokeColor = palette.stroke;
  const fillColor = palette.fill;
  const glowColor = palette.glow;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20 overflow-visible transition-all duration-300"
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      <defs>
        {/* Animated Dash Stroke Gradient using theme color */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.95" />
          <stop offset="50%" stopColor={palette.badgeBorder} stopOpacity="0.9" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.95" />
        </linearGradient>

        {/* Directed Arrow Marker matching the polygon theme */}
        <marker
          id={markerArrowId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* 1. Shaded Polygon Area */}
      <polygon
        points={polygonPointsStr}
        fill={fillColor}
        stroke="none"
        className="transition-all duration-300"
      />

      {/* 2. Outer Glow / Shadow Line */}
      <path
        d={pathD}
        fill="none"
        stroke={glowColor}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 3. Main Directed Polygon Edges with Flow Arrows */}
      {points.map((p, i) => {
        const nextP = points[(i + 1) % points.length];
        return (
          <g key={`edge-${i}`}>
            <line
              x1={p.x}
              y1={p.y}
              x2={nextP.x}
              y2={nextP.y}
              stroke={strokeColor}
              strokeWidth="2.75"
              strokeDasharray="6 4"
              strokeLinecap="round"
              markerEnd={`url(#${markerArrowId})`}
            />
          </g>
        );
      })}

      {/* 4. Interactive Node Badges with +/- Signs and Step Order */}
      {points.map((p, i) => {
        const isPlus = p.sign === '+';
        const isEnteringOrigin =
          i === 0 ||
          (enteringCellCoord &&
            enteringCellCoord.row === p.row &&
            enteringCellCoord.col === p.col);

        // Green for +, Red/Rose for -
        const badgeColor = isPlus ? '#059669' : '#e11d48'; // emerald-600 : rose-600
        const badgeBorder = isPlus ? '#34d399' : '#fb7185';
        const radius = isEnteringOrigin ? 17 : 15;

        return (
          <g key={`node-${i}`} className="transition-transform duration-200">
            {/* Soft backdrop circle for contrast */}
            <circle
              cx={p.x}
              cy={p.y}
              r={radius + 4}
              fill="white"
              fillOpacity="0.95"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
            />

            {/* If this is the origin / entering empty cell, draw a distinct theme ring */}
            {isEnteringOrigin && (
              <circle
                cx={p.x}
                cy={p.y}
                r={radius + 2}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeDasharray="3 2"
              />
            )}

            {/* Main sign badge circle */}
            <circle
              cx={p.x}
              cy={p.y}
              r={radius}
              fill={badgeColor}
              stroke={badgeBorder}
              strokeWidth="2"
            />

            {/* + or - Sign Text */}
            <text
              x={p.x}
              y={p.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={isEnteringOrigin ? '18' : '16'}
              fontWeight="900"
              fontFamily="monospace"
            >
              {p.sign}
            </text>

            {/* Step Sequence Chip on Top Right (e.g. #1 (+), #2 (-), #3 (+)...) */}
            <g transform={`translate(${p.x + 10}, ${p.y - 12})`}>
              <rect
                x="-10"
                y="-7"
                width="20"
                height="15"
                rx="4"
                fill={palette.badgeBg}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="800"
                fontFamily="sans-serif"
              >
                #{p.index}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
