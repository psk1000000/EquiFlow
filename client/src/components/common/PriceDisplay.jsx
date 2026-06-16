import { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatChange, formatPercent } from '../../utils/formatters';
import './PriceDisplay.css';

/**
 * Animated price display with flash effect on change.
 */
export default function PriceDisplay({ price, change, changePercent, size = 'default' }) {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (prevPriceRef.current !== price && price != null) {
      const direction = price > prevPriceRef.current ? 'flash-green' : 'flash-red';
      setFlashClass(direction);

      const timer = setTimeout(() => setFlashClass(''), 800);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
  }, [price]);

  const isPositive = change >= 0;
  const colorClass = isPositive ? 'positive' : 'negative';
  const arrow = isPositive ? '▲' : '▼';

  const priceStyle = size === 'large'
    ? { fontSize: 'var(--font-size-3xl)' }
    : {};

  return (
    <div className={`price-display ${flashClass}`}>
      <span className="price-value" style={priceStyle}>
        {formatCurrency(price)}
      </span>
      {change != null && (
        <span className={`price-change ${colorClass}`}>
          <span className="price-change-arrow">{arrow}</span>
          {formatChange(change)} ({formatPercent(changePercent)})
        </span>
      )}
    </div>
  );
}
