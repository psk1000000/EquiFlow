import React, { useEffect, useRef, useMemo, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import './CandlestickChart.css';

/**
 * Professional trading chart using lightweight-charts v5.
 *
 * Uses an Area Series since our data is 1-second ticks,
 * which provides a cleaner look than 1-second candlesticks.
 *
 * Key guard: lightweight-charts throws a fatal error if the container
 * has zero or negative dimensions at creation time. We use a
 * ResizeObserver to defer chart creation until the container is laid out.
 */
export default function CandlestickChart({ data, color }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const chartData = useMemo(() => {
    if (!data?.history) return [];

    // lightweight-charts requires unique time values ascending.
    const uniquePoints = new Map();

    data.history.forEach((pt) => {
      const timeSeconds = Math.floor(pt.timestamp / 1000);
      uniquePoints.set(timeSeconds, {
        time: timeSeconds,
        value: pt.price,
      });
    });

    return Array.from(uniquePoints.values()).sort((a, b) => a.time - b.time);
  }, [data?.history]);

  // Step 1: Wait for the container to have real dimensions
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    // If it already has dimensions (e.g. on re-render), proceed immediately
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      setIsReady(true);
      return;
    }

    // Otherwise wait for the layout engine via ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setIsReady(true);
          ro.disconnect();
        }
      }
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Step 2: Create the chart only once the container is ready
  useEffect(() => {
    if (!isReady || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Final safety guard
    if (w <= 0 || h <= 0) return;

    const isPositive = data?.change >= 0;
    const themeColor = color || (isPositive ? '#22c55e' : '#ef4444');

    const chart = createChart(container, {
      width: w,
      height: h,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b95a8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: themeColor,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: themeColor,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // v5 API: use chart.addSeries(AreaSeries, options) instead of chart.addAreaSeries(options)
    const series = chart.addSeries(AreaSeries, {
      lineColor: themeColor,
      topColor: `${themeColor}40`,
      bottomColor: `${themeColor}05`,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    if (chartData.length > 0) {
      series.setData(chartData);
      chart.timeScale().fitContent();
    }

    // Resize handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const cw = chartContainerRef.current.clientWidth;
        const ch = chartContainerRef.current.clientHeight;
        if (cw > 0 && ch > 0) {
          chartRef.current.applyOptions({ width: cw, height: ch });
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle data updates
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData);
    }
  }, [chartData]);

  // Update theme color when price direction flips
  useEffect(() => {
    if (seriesRef.current && chartRef.current) {
      const isPositive = data?.change >= 0;
      const themeColor = color || (isPositive ? '#22c55e' : '#ef4444');
      seriesRef.current.applyOptions({
        lineColor: themeColor,
        topColor: `${themeColor}40`,
        bottomColor: `${themeColor}05`,
      });
      chartRef.current.applyOptions({
        crosshair: {
          vertLine: { labelBackgroundColor: themeColor },
          horzLine: { labelBackgroundColor: themeColor },
        },
      });
    }
  }, [data?.change, color]);

  return (
    <div className="candlestick-chart-container">
      <div ref={chartContainerRef} className="candlestick-chart-root" />
    </div>
  );
}
