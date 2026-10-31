import React from 'react';

interface SparklineChartProps {
  data: number[];
  color?: string; // hex or tailwind stroke class
  strokeColor?: string;
  fillColor?: string;
  height?: number;
  width?: number | string;
  unit?: string;
  label?: string;
  showMinMax?: boolean;
  minMaxDecimals?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  strokeColor = '#38bdf8', // sky-400
  fillColor = 'rgba(56, 189, 248, 0.15)',
  height = 36,
  unit = '',
  label = '',
  showMinMax = false,
  minMaxDecimals = 1
}) => {
  // If data has fewer than 2 points, display placeholder or single dot
  if (!data || data.length === 0) {
    return (
      <div className="h-9 flex items-center justify-center text-[10px] text-slate-500 font-mono">
        Recording telemetry...
      </div>
    );
  }

  const safeData = data.slice(-24); // Show up to last 24 recorded points
  const minVal = Math.min(...safeData);
  const maxVal = Math.max(...safeData);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const svgWidth = 160;
  const svgHeight = height;
  const paddingY = 4;
  const usableHeight = svgHeight - paddingY * 2;

  // Generate points
  const points = safeData.map((val, idx) => {
    const x = safeData.length === 1 ? svgWidth / 2 : (idx / (safeData.length - 1)) * (svgWidth - 8) + 4;
    const y = svgHeight - paddingY - ((val - minVal) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].split(',')[0]},${svgHeight} L ${points[0].split(',')[0]},${svgHeight} Z`;

  // Compute 3-hour trend
  const latest = safeData[safeData.length - 1];
  const previous = safeData.length > 3 ? safeData[safeData.length - 4] : safeData[0];
  const diff = latest - previous;
  const diffPerStep = safeData.length > 1 ? (diff / Math.max(1, safeData.length > 3 ? 3 : safeData.length - 1)) : 0;

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label={label ? `${label} trend chart` : 'Telemetry sparkline chart'}
        >
          {/* Subtle horizontal baseline grid */}
          <line
            x1="0"
            y1={svgHeight - 1}
            x2={svgWidth}
            y2={svgHeight - 1}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1="0"
            y1={paddingY}
            x2={svgWidth}
            y2={paddingY}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Area under curve */}
          <path d={areaD} fill={fillColor} />

          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Endpoint pulsing dot */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].split(',')[0]}
              cy={points[points.length - 1].split(',')[1]}
              r="2.5"
              fill={strokeColor}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {showMinMax && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>Min: {minVal.toFixed(minMaxDecimals)}{unit}</span>
          <span className={diffPerStep > 0.01 ? 'text-emerald-400' : diffPerStep < -0.01 ? 'text-amber-400' : 'text-slate-400'}>
            {diffPerStep > 0.01 ? `▲ +${diffPerStep.toFixed(minMaxDecimals)}/h` : diffPerStep < -0.01 ? `▼ ${diffPerStep.toFixed(minMaxDecimals)}/h` : '● Steady'}
          </span>
          <span>Max: {maxVal.toFixed(minMaxDecimals)}{unit}</span>
        </div>
      )}
    </div>
  );
};
