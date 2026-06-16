import { useState } from 'react';
import { formatCurrency, formatPercent, formatTime } from '../../utils/formatters';
import './Portfolio.css';

/**
 * Portfolio overview showing cash, holdings, P&L, and transaction history.
 */
export default function Portfolio({ portfolio, transactions = [] }) {
  const [showTransactions, setShowTransactions] = useState(false);

  if (!portfolio) {
    return (
      <div className="portfolio-panel glass" id="portfolio-panel">
        <h3>Portfolio</h3>
        <div className="portfolio-empty">Loading portfolio…</div>
      </div>
    );
  }

  const { cash, holdings, totalPortfolioValue, totalPnL, totalRealisedPnL, totalUnrealisedPnL } = portfolio;
  const pnlClass = totalPnL >= 0 ? 'positive' : 'negative';

  return (
    <div className="portfolio-panel glass" id="portfolio-panel">
      <h3>Portfolio</h3>

      <div className="portfolio-summary">
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Total Value</div>
          <div className="portfolio-stat-value large">{formatCurrency(totalPortfolioValue)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Total P&L</div>
          <div className={`portfolio-stat-value large ${pnlClass}`}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Cash</div>
          <div className="portfolio-stat-value">{formatCurrency(cash)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Unrealised P&L</div>
          <div className={`portfolio-stat-value ${totalUnrealisedPnL >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalUnrealisedPnL)}
          </div>
        </div>
      </div>

      {holdings.length > 0 && (
        <>
          <h3 className="portfolio-holdings-title">Holdings</h3>
          {holdings.map((h) => (
            <div key={h.ticker} className="portfolio-holding">
              <div className="portfolio-holding-info">
                <span className="portfolio-holding-ticker">{h.ticker}</span>
                <span className="portfolio-holding-qty">
                  {h.quantity} shares · Avg {formatCurrency(h.avgCostBasis)}
                </span>
              </div>
              <div className="portfolio-holding-pnl">
                <div className="portfolio-holding-value">{formatCurrency(h.marketValue)}</div>
                <div className={`portfolio-holding-change ${h.unrealisedPnL >= 0 ? 'positive' : 'negative'}`}>
                  {h.unrealisedPnL >= 0 ? '+' : ''}{formatCurrency(h.unrealisedPnL)} ({formatPercent(h.unrealisedPnLPct)})
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {holdings.length === 0 && (
        <div className="portfolio-empty">
          No holdings yet. Subscribe to stocks and start trading!
        </div>
      )}

      {transactions.length > 0 && (
        <>
          <div
            className="portfolio-transactions-title"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            <h3>Recent Trades</h3>
            <span className={`portfolio-toggle-icon ${showTransactions ? 'expanded' : ''}`}>▼</span>
          </div>
          {showTransactions && (
            <div>
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="portfolio-transaction">
                  <span className={`tx-type ${tx.type.toLowerCase()}`}>{tx.type}</span>
                  <span className="tx-details">
                    {tx.quantity}× {tx.ticker} @ {formatCurrency(tx.pricePerShare)}
                  </span>
                  <span className="tx-value">{formatCurrency(tx.totalValue)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
