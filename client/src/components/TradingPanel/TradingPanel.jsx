import { useState, useEffect } from 'react';
import { SUPPORTED_STOCKS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import './TradingPanel.css';

/**
 * Trading modal for executing buy/sell orders.
 */
export default function TradingPanel({
  ticker,
  type: initialType,
  currentPrice,
  availableCash,
  holdingQty = 0,
  onExecute,
  onClose,
  loading,
  error,
}) {
  const [type, setType] = useState(initialType || 'BUY');
  const [quantity, setQuantity] = useState(1);
  const stock = SUPPORTED_STOCKS[ticker] || {};

  // Reset error when changing type or quantity
  useEffect(() => {
    setQuantity(1);
  }, [type]);

  const totalValue = quantity * (currentPrice || 0);
  const maxBuyQty = currentPrice > 0 ? Math.floor(availableCash / currentPrice) : 0;
  const maxSellQty = holdingQty;

  const handleQuantityChange = (value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setQuantity(Math.max(0, num));
  };

  const handleSubmit = () => {
    if (quantity <= 0) return;
    onExecute(ticker, quantity, type);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="trading-panel-overlay" onClick={handleOverlayClick}>
      <div className="trading-panel glass-elevated" id="trading-panel">
        <div className="trading-panel-header">
          <h2>Trade {ticker}</h2>
          <button className="trading-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="trading-type-toggle">
          <button
            className={`trading-type-btn ${type === 'BUY' ? 'active-buy' : ''}`}
            onClick={() => setType('BUY')}
          >
            Buy
          </button>
          <button
            className={`trading-type-btn ${type === 'SELL' ? 'active-sell' : ''}`}
            onClick={() => setType('SELL')}
          >
            Sell
          </button>
        </div>

        <div className="trading-field">
          <label>Quantity</label>
          <div className="trading-quantity">
            <button
              className="qty-btn"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <input
              className="input"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              id="trade-quantity-input"
            />
            <button
              className="qty-btn"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="trading-summary">
          <div className="trading-summary-row">
            <span className="trading-summary-label">Stock</span>
            <span className="trading-summary-value">{ticker} — {stock.name}</span>
          </div>
          <div className="trading-summary-row">
            <span className="trading-summary-label">Market Price</span>
            <span className="trading-summary-value">{formatCurrency(currentPrice)}</span>
          </div>
          <div className="trading-summary-row">
            <span className="trading-summary-label">Quantity</span>
            <span className="trading-summary-value">{quantity} shares</span>
          </div>
          <div className="trading-summary-row">
            <span className="trading-summary-label">
              {type === 'BUY' ? 'Total Cost' : 'Total Proceeds'}
            </span>
            <span className="trading-summary-value" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="trading-summary-row">
            <span className="trading-summary-label">
              {type === 'BUY' ? 'Available Cash' : 'Shares Held'}
            </span>
            <span className="trading-summary-value" style={{ color: 'var(--text-muted)' }}>
              {type === 'BUY' ? formatCurrency(availableCash) : `${maxSellQty} shares`}
            </span>
          </div>
        </div>

        {error && <div className="trading-error">{error}</div>}

        <button
          className={`btn trading-submit ${type === 'BUY' ? 'btn-success' : 'btn-danger'}`}
          onClick={handleSubmit}
          disabled={
            loading ||
            quantity <= 0 ||
            (type === 'BUY' && totalValue > availableCash) ||
            (type === 'SELL' && quantity > maxSellQty)
          }
          id="trade-execute-btn"
        >
          {loading
            ? 'Processing…'
            : `${type === 'BUY' ? 'Buy' : 'Sell'} ${quantity} ${ticker} for ${formatCurrency(totalValue)}`}
        </button>
      </div>
    </div>
  );
}
