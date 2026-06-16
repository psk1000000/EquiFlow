import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import './OrderBook.css';

/**
 * Real-time Order Book displaying Bids and Asks with visual depth bars.
 */
export default function OrderBook({ currentPrice, orderBookData, onPriceClick }) {
  const { bids = [], asks = [] } = orderBookData || {};

  // Sort asks ascending (lowest ask at bottom near spread)
  const sortedAsks = useMemo(() => {
    return [...asks].sort((a, b) => a.price - b.price).slice(0, 8);
  }, [asks]);

  // Sort bids descending (highest bid at top near spread)
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => b.price - a.price).slice(0, 8);
  }, [bids]);

  // Calculate cumulative totals for depth bars
  const maxTotal = useMemo(() => {
    let max = 0;
    let sum = 0;
    sortedAsks.forEach(a => { sum += a.size; max = Math.max(max, sum); });
    sum = 0;
    sortedBids.forEach(b => { sum += b.size; max = Math.max(max, sum); });
    return max || 1;
  }, [sortedAsks, sortedBids]);

  const renderRow = (order, type, cumulativeTotal) => {
    const depthPercentage = (cumulativeTotal / maxTotal) * 100;
    
    return (
      <div 
        key={`${type}-${order.price}`} 
        className={`order-row ${type}`}
        onClick={() => onPriceClick && onPriceClick(order.price)}
      >
        <div 
          className="order-row-bg" 
          style={{ width: `${depthPercentage}%` }} 
        />
        <div className="order-row-content">
          <span className="order-row-price">{order.price.toFixed(2)}</span>
          <span className="order-row-size">{order.size}</span>
          <span className="order-row-total">{cumulativeTotal}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="order-book glass">
      <div className="order-book-header">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="order-book-section order-book-asks">
        {(() => {
          let runningTotal = 0;
          // Render asks in reverse so highest price is at the top
          return [...sortedAsks].reverse().map(ask => {
            runningTotal += ask.size;
            return renderRow(ask, 'ask', runningTotal);
          });
        })()}
      </div>

      <div className="order-book-spread">
        <span className={currentPrice ? '' : 'text-muted'}>
          {currentPrice ? formatCurrency(currentPrice) : '---'}
        </span>
      </div>

      <div className="order-book-section order-book-bids">
        {(() => {
          let runningTotal = 0;
          return sortedBids.map(bid => {
            runningTotal += bid.size;
            return renderRow(bid, 'bid', runningTotal);
          });
        })()}
      </div>
    </div>
  );
}
