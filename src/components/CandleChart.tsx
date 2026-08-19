import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from "lightweight-charts";
import { getCandles, getStock } from "@/lib/stocks";

export function CandleChart({ symbol, height = 380 }: { symbol: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height,
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa", fontFamily: "JetBrains Mono" },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      crosshair: { vertLine: { color: "rgba(0,255,136,0.3)" }, horzLine: { color: "rgba(0,255,136,0.3)" } },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88", downColor: "#ff3b3b",
      borderUpColor: "#00ff88", borderDownColor: "#ff3b3b",
      wickUpColor: "#00ff88", wickDownColor: "#ff3b3b",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const onResize = () => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [height]);

  useEffect(() => {
    const stock = getStock(symbol);
    if (!stock || !seriesRef.current) return;
    const update = () => {
      const candles = getCandles(symbol, stock.basePrice, 80);
      const data: CandlestickData[] = candles.map((c) => ({
        time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
      }));
      seriesRef.current?.setData(data);
    };
    update();
    const id = setInterval(update, 1500);
    return () => clearInterval(id);
  }, [symbol]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
