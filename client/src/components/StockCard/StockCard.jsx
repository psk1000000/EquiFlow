import PriceDisplay from '../common/PriceDisplay';
import SparklineChart from '../SparklineChart/SparklineChart';
import { SUPPORTED_STOCKS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import './StockCard.css';

/**
 * Hero stock card component displaying:
 * - Ticker + company name
 * - Animated live price with change
 * - Sparkline chart
 * - Day high/low range bar
 * - Buy/Sell quick-trade buttons
 */
export default function StockCard({ data, onUnsubscribe, onBuy, onSell }) {
  if (!data) return null;

  const stockMeta = SUPPORTED_STOCKS[data.ticker] || {};
  const { ticker, name, price, change, changePercent, high, low, history, color } = data;
  const accentColor = stockMeta.color || color || '#6366f1';

  // Calculate range bar positions
  const range = high - low || 1;
  const currentPosition = ((price - low) / range) * 100;

  return (
    <div
      className="stock-card glass"
      style={{ '--card-accent-color': accentColor }}
      id={`stock-card-${ticker}`}
    >
      <div className="stock-card-header">
        <div className="stock-card-info">
          <div className="stock-card-logo">
            {stockMeta.logo || '📈'}
          </div>
          <div className="stock-card-meta">
            <span className="stock-card-ticker">{ticker}</span>
            <span className="stock-card-name">{name || stockMeta.name}</span>
          </div>
        </div>
        <button
          className="stock-card-unsub"
          onClick={() => onUnsubscribe(ticker)}
          title="Unsubscribe"
          aria-label={`Unsubscribe from ${ticker}`}
        >
          ✕
        </button>
      </div>

      <div className="stock-card-price">
        <PriceDisplay
          price={price}
          change={change}
          changePercent={changePercent}
        />
      </div>

      <SparklineChart
        history={history}
        color={accentColor}
        change={change}
      />

      <div className="stock-card-range">
        <span className="range-label">{formatCurrency(low)}</span>
        <div className="range-bar-container">
          <div
            className="range-bar-fill"
            style={{ left: '0%', right: `${100 - currentPosition}%` }}
          />
          <div
            className="range-bar-marker"
            style={{ left: `${currentPosition}%` }}
          />
        </div>
        <span className="range-label">{formatCurrency(high)}</span>
      </div>

      <div className="stock-card-actions">
        <button
          className="btn btn-success btn-sm"
          onClick={() => onBuy(ticker)}
          id={`buy-btn-${ticker}`}
        >
          Buy
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onSell(ticker)}
          id={`sell-btn-${ticker}`}
        >
          Sell
        </button>
      </div>
    </div>
  );
}
