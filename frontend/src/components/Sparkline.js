import React from 'react';

export default function Sparkline({ data = [], width = 80, height = 28, color }) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const firstY = parseFloat(points[0].split(',')[1]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);
  const trending = lastY < firstY; // lower y = higher price (inverted SVG axis)

  const strokeColor = color || (trending ? '#00e5a0' : '#ff4466');

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
