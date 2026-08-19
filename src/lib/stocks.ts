export type Stock = {
  symbol: string;
  name: string;
  basePrice: number;
};

export const STOCKS: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", basePrice: 2942.1 },
  { symbol: "TCS", name: "Tata Consultancy Services", basePrice: 3812.45 },
  { symbol: "INFY", name: "Infosys", basePrice: 1532.0 },
  { symbol: "HDFCBANK", name: "HDFC Bank", basePrice: 1442.15 },
  { symbol: "ICICIBANK", name: "ICICI Bank", basePrice: 1012.3 },
  { symbol: "TATAMOTORS", name: "Tata Motors", basePrice: 942.0 },
  { symbol: "WIPRO", name: "Wipro", basePrice: 482.1 },
  { symbol: "SBIN", name: "State Bank of India", basePrice: 722.45 },
  { symbol: "ADANIENT", name: "Adani Enterprises", basePrice: 3122.9 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", basePrice: 1212.0 },
];

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

// Deterministic pseudo-random based on (symbol, second) so multiple tabs see the same prices
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function noise(symbol: string, t: number): number {
  const a = hash(symbol + ":" + t) / 2 ** 32; // 0..1
  return a - 0.5;
}

const PERIOD_SEC = 5; // each candle = 5 seconds

export function priceAt(symbol: string, basePrice: number, ts: number): number {
  // Smooth random walk via summed sinusoidal noise
  const minute = Math.floor(ts / 1000);
  let drift = 0;
  for (let i = 0; i < 8; i++) {
    drift += Math.sin((minute / (8 + i * 3)) + hash(symbol + i)) * (0.004 / (i + 1));
  }
  const jitter = noise(symbol, minute) * 0.003;
  const factor = 1 + drift + jitter;
  return +(basePrice * factor).toFixed(2);
}

export function getCandles(symbol: string, basePrice: number, count = 80, endTs: number = Date.now()): Candle[] {
  const out: Candle[] = [];
  const endBucket = Math.floor(endTs / 1000 / PERIOD_SEC);
  for (let i = count - 1; i >= 0; i--) {
    const bucket = endBucket - i;
    const tStart = bucket * PERIOD_SEC * 1000;
    const samples: number[] = [];
    for (let s = 0; s < PERIOD_SEC; s++) {
      samples.push(priceAt(symbol, basePrice, tStart + s * 1000));
    }
    const open = samples[0];
    const close = samples[samples.length - 1];
    const high = Math.max(...samples);
    const low = Math.min(...samples);
    const volSeed = Math.abs(noise(symbol + "v", bucket)) * 50000 + 5000;
    out.push({ time: bucket * PERIOD_SEC, open, high, low, close, volume: Math.round(volSeed) });
  }
  return out;
}

export function getStock(symbol: string): Stock | undefined {
  return STOCKS.find((s) => s.symbol === symbol);
}

export function currentPrice(symbol: string): number {
  const s = getStock(symbol);
  if (!s) return 0;
  return priceAt(symbol, s.basePrice, Date.now());
}

export function priceChangePct(symbol: string): number {
  const s = getStock(symbol);
  if (!s) return 0;
  const now = priceAt(symbol, s.basePrice, Date.now());
  const ref = priceAt(symbol, s.basePrice, Date.now() - 5 * 60 * 1000);
  return ((now - ref) / ref) * 100;
}

export function formatINR(n: number): string {
  if (!isFinite(n)) return "₹0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "₹" + abs.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
