import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import './SparklineChart.css';

/**
 * Mini sparkline area chart for stock price history.
 * Green gradient when price is up, red when down.
 */
export default function SparklineChart({ history = [], color, change = 0 }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map((point, index) => ({
      index,
      price: point.price,
    }));
  }, [history]);

  if (chartData.length < 2) {
    return <div className="sparkline-container" />;
  }

  const isPositive = change >= 0;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillId = `sparkline-fill-${color?.replace('#', '') || 'default'}`;

  return (
    <div className="sparkline-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
