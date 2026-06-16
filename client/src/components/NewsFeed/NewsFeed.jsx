import { SENTIMENT_CONFIG } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';
import './NewsFeed.css';

/**
 * News feed component with scrolling ticker strip and vertical news list.
 */
export default function NewsFeed({ news = [] }) {
  return (
    <div className="news-feed glass" id="news-feed">
      <h3>📰 Market News</h3>

      {news.length === 0 ? (
        <div className="news-empty">
          Waiting for news…<br />
          <span style={{ fontSize: '10px' }}>Headlines will appear shortly</span>
        </div>
      ) : (
        <div className="news-list">
          {news.slice(0, 20).map((item) => {
            const sentiment = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;

            return (
              <div key={item.id} className="news-item">
                <span className="news-sentiment">{sentiment.icon}</span>
                <div className="news-content">
                  <div className="news-headline">{item.headline}</div>
                  <div className="news-meta">
                    {item.ticker && (
                      <span className="news-ticker-tag">{item.ticker}</span>
                    )}
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Scrolling news ticker strip for the top of the dashboard.
 */
export function NewsTickerStrip({ news = [] }) {
  if (news.length === 0) return null;

  const displayItems = [...news.slice(0, 10), ...news.slice(0, 10)]; // Duplicate for seamless scroll

  return (
    <div className="news-ticker-strip">
      <div className="news-ticker-track">
        {displayItems.map((item, i) => {
          const sentiment = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
          return (
            <span key={`${item.id}-${i}`} className="news-ticker-item">
              <span className="news-sentiment">{sentiment.icon}</span>
              {item.ticker && <strong>{item.ticker}</strong>}
              {item.headline}
            </span>
          );
        })}
      </div>
    </div>
  );
}
