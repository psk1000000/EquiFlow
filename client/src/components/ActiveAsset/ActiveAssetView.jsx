import React from 'react';
import CandlestickChart from '../StockChart/CandlestickChart';
import OrderBook from '../OrderBook/OrderBook';
import PriceDisplay from '../common/PriceDisplay';
import { SUPPORTED_STOCKS } from '../../utils/constants';
import './ActiveAssetView.css';

/**
 * Top dashboard view for the actively selected stock,
 * showing a large Candlestick chart and a live Order Book.
 */
export default function ActiveAssetView({ data, onTradeClick }) {
  if (!data) return null;

  const stockMeta = SUPPORTED_STOCKS[data.ticker] || {};
  const { ticker, name, price, change, changePercent, color, orderBook } = data;
  const accentColor = stockMeta.color || color || '#6366f1';

  return (
    <div className="active-asset-view">
      <div className="active-asset-main">
        <div className="active-asset-header glass">
          <div className="active-asset-info">
            <div className="active-asset-logo">
              {stockMeta.logo || '📈'}
            </div>
            <div className="active-asset-meta">
              <span className="active-asset-ticker" style={{ color: accentColor }}>
                {ticker}
              </span>
              <span className="active-asset-name">{name || stockMeta.name}</span>
            </div>
          </div>
          
          <div className="active-asset-price-wrap">
            <PriceDisplay
              price={price}
              change={change}
              changePercent={changePercent}
              size="large"
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
               <button className="btn btn-success btn-sm" onClick={() => onTradeClick(ticker, 'BUY')}>Buy</button>
               <button className="btn btn-danger btn-sm" onClick={() => onTradeClick(ticker, 'SELL')}>Sell</button>
            </div>
          </div>
        </div>

        <div className="active-asset-chart glass">
          <CandlestickChart data={data} color={accentColor} />
        </div>
      </div>

      <div className="active-asset-orderbook">
        <h3>Order Book (Level 2)</h3>
        <OrderBook 
          currentPrice={price} 
          orderBookData={orderBook}
          onPriceClick={(p) => console.log('Price clicked:', p)}
        />
      </div>
    </div>
  );
}
