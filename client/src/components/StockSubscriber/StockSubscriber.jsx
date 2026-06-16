import { SUPPORTED_STOCKS, SUPPORTED_TICKERS } from '../../utils/constants';
import './StockSubscriber.css';

/**
 * Stock subscription panel — shows all available stocks with
 * subscribe/unsubscribe buttons.
 */
export default function StockSubscriber({ subscriptions, onSubscribe, onUnsubscribe }) {
  return (
    <div className="stock-subscriber glass" id="stock-subscriber-panel">
      <h3>Stocks</h3>
      <div className="stock-list">
        {SUPPORTED_TICKERS.map((ticker) => {
          const stock = SUPPORTED_STOCKS[ticker];
          const isSubscribed = subscriptions.includes(ticker);

          return (
            <div key={ticker} className="stock-list-item" id={`stock-item-${ticker}`}>
              <div className="stock-list-item-info">
                <div
                  className="stock-list-item-dot"
                  style={{ background: stock.color }}
                />
                <div>
                  <div className="stock-list-item-ticker">{ticker}</div>
                  <div className="stock-list-item-name">{stock.name}</div>
                </div>
              </div>
              <button
                className={`btn btn-sm ${isSubscribed ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => isSubscribed ? onUnsubscribe(ticker) : onSubscribe(ticker)}
              >
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
