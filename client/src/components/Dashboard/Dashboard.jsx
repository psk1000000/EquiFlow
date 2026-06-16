import { useState, useCallback, useEffect } from 'react';
import Navbar from '../common/Navbar';
import StockSubscriber from '../StockSubscriber/StockSubscriber';
import StockCard from '../StockCard/StockCard';
import Portfolio from '../Portfolio/Portfolio';
import NewsFeed from '../NewsFeed/NewsFeed';
import { NewsTickerStrip } from '../NewsFeed/NewsFeed';
import TradingPanel from '../TradingPanel/TradingPanel';
import NotificationToast from '../Notifications/NotificationToast';
import ActiveAssetView from '../ActiveAsset/ActiveAssetView';
import { useSocket } from '../../hooks/useSocket';
import { useStockData } from '../../hooks/useStockData';
import { useTrading } from '../../hooks/useTrading';
import { useNotifications } from '../../hooks/useNotifications';
import './Dashboard.css';

/**
 * Main dashboard — orchestrates all hooks and composes the layout.
 */
export default function Dashboard() {
  const socketHook = useSocket();
  const { connected } = socketHook;
  const { stocks, subscriptions, news, handleSubscribe, handleUnsubscribe } = useStockData(socketHook);
  const { portfolio, transactions, executeBuy, executeSell, loading: tradeLoading } = useTrading();
  const { notifications, unreadCount, toasts, dismissToast, markAsRead, clearAll } = useNotifications(connected);

  // Active Asset state
  const [activeTicker, setActiveTicker] = useState(null);

  // Auto-select first subscribed stock if none is active
  useEffect(() => {
    if (subscriptions.length > 0 && (!activeTicker || !subscriptions.includes(activeTicker))) {
      setActiveTicker(subscriptions[0]);
    } else if (subscriptions.length === 0) {
      setActiveTicker(null);
    }
  }, [subscriptions, activeTicker]);

  // Trading panel state
  const [tradeModal, setTradeModal] = useState(null); // { ticker, type }
  const [tradeError, setTradeError] = useState(null);

  const openTradeModal = useCallback((ticker, type = 'BUY') => {
    setTradeError(null);
    setTradeModal({ ticker, type });
  }, []);

  const closeTradeModal = useCallback(() => {
    setTradeModal(null);
    setTradeError(null);
  }, []);

  const handleTrade = useCallback(async (ticker, quantity, type) => {
    setTradeError(null);
    try {
      if (type === 'BUY') {
        await executeBuy(ticker, quantity);
      } else {
        await executeSell(ticker, quantity);
      }
      closeTradeModal();
    } catch (err) {
      setTradeError(err.message);
    }
  }, [executeBuy, executeSell, closeTradeModal]);

  // Get holding quantity for the trading panel
  const getHoldingQty = (ticker) => {
    if (!portfolio?.holdings) return 0;
    const holding = portfolio.holdings.find((h) => h.ticker === ticker);
    return holding?.quantity || 0;
  };

  return (
    <div className="dashboard" id="dashboard">
      <Navbar
        connected={connected}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
        clearAll={clearAll}
      />

      <NewsTickerStrip news={news} />

      <div className="dashboard-content">
        {/* Left Sidebar */}
        <div className="dashboard-sidebar-left">
          <StockSubscriber
            subscriptions={subscriptions}
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
          />
          <Portfolio
            portfolio={portfolio}
            transactions={transactions}
          />
        </div>

        {/* Center — Main Area */}
        <div className="dashboard-main">
          {activeTicker && stocks[activeTicker] && (
            <ActiveAssetView 
              key={activeTicker}
              data={stocks[activeTicker]} 
              onTradeClick={openTradeModal} 
            />
          )}

          <div className="dashboard-main-header">
            <h2>Watchlist</h2>
            <span>{subscriptions.length} stock{subscriptions.length !== 1 ? 's' : ''} tracked</span>
          </div>

          <div className="stock-cards-grid">
            {subscriptions.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">📈</div>
                <h3>No stocks subscribed</h3>
                <p>Select stocks from the panel on the left to start tracking live prices.</p>
              </div>
            ) : (
              subscriptions.map((ticker) => (
                <div key={ticker} onClick={() => setActiveTicker(ticker)} style={{ cursor: 'pointer' }}>
                  <StockCard
                    data={stocks[ticker]}
                    onUnsubscribe={handleUnsubscribe}
                    onBuy={(t) => openTradeModal(t, 'BUY')}
                    onSell={(t) => openTradeModal(t, 'SELL')}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-sidebar-right">
          <NewsFeed news={news} />
        </div>
      </div>

      {/* Trading Modal */}
      {tradeModal && (
        <TradingPanel
          ticker={tradeModal.ticker}
          type={tradeModal.type}
          currentPrice={stocks[tradeModal.ticker]?.price || 0}
          availableCash={portfolio?.cash || 0}
          holdingQty={getHoldingQty(tradeModal.ticker)}
          onExecute={handleTrade}
          onClose={closeTradeModal}
          loading={tradeLoading}
          error={tradeError}
        />
      )}

      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
