/**
 * Simulated market news generator.
 *
 * Produces realistic-looking financial news headlines at random intervals.
 * Each headline is tagged with a sentiment (bullish / bearish / neutral) and
 * optionally associated with a specific stock ticker.
 *
 * Headlines are drawn from curated template pools to avoid repetition and
 * provide variety.  The generator uses a weighted random selection to control
 * how often different sentiment categories appear.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SUPPORTED_TICKERS, STOCKS } from '../config/index.js';

/** Minimum delay between news items (ms). */
const MIN_INTERVAL = 8_000;
/** Maximum delay between news items (ms). */
const MAX_INTERVAL = 15_000;

/**
 * Stock-specific headline templates.
 * `{name}` and `{ticker}` are replaced at generation time.
 */
const STOCK_HEADLINES = {
  GOOG: {
    bullish: [
      '{name} unveils breakthrough AI model surpassing industry benchmarks',
      '{ticker} cloud revenue surges 35% in latest quarter',
      'Alphabet announces $10B share buyback programme',
      '{name} deepens partnership with major enterprise clients',
      'Waymo autonomous ride-hailing expands to 5 new cities',
      '{name} ad revenue exceeds analyst expectations',
    ],
    bearish: [
      '{name} faces renewed antitrust scrutiny from DOJ',
      '{ticker} loses market share in search to emerging AI rivals',
      'Alphabet cuts 500 jobs in restructuring move',
      '{name} warns of slower ad growth amid economic headwinds',
      'EU regulators impose fresh fines on {name} over data practices',
    ],
    neutral: [
      '{name} CEO addresses developers at annual I/O conference',
      '{ticker} trading volume above 30-day average',
      'Alphabet board appoints new independent director',
    ],
  },
  TSLA: {
    bullish: [
      '{name} reports record quarterly deliveries beating estimates',
      '{ticker} announces new Gigafactory in Southeast Asia',
      'Tesla Full Self-Driving reaches major safety milestone',
      '{name} energy storage division revenue doubles year-over-year',
      'Cybertruck demand exceeds 2-year production backlog',
    ],
    bearish: [
      '{name} recalls 200,000 vehicles over software issue',
      '{ticker} margins shrink as price war intensifies',
      'Tesla faces production delays at Berlin Gigafactory',
      '{name} loses key executive to rival EV maker',
      'Analysts downgrade {ticker} citing valuation concerns',
    ],
    neutral: [
      'Elon Musk discusses {name} roadmap at shareholder meeting',
      '{ticker} opens new showroom in Dubai',
      '{name} files patent for next-gen battery technology',
    ],
  },
  AMZN: {
    bullish: [
      '{name} AWS secures $5B government cloud contract',
      '{ticker} Prime membership hits 300 million globally',
      'Amazon same-day delivery now available in 100+ cities',
      '{name} ad platform revenue grows 40% year-over-year',
      'AWS launches new AI-as-a-Service product line',
    ],
    bearish: [
      '{name} warehouse workers vote to unionise in 3 new locations',
      '{ticker} faces FTC lawsuit over marketplace practices',
      'Amazon logistics costs spike amid supply chain disruptions',
      '{name} pulls back on physical retail expansion plans',
    ],
    neutral: [
      '{name} announces date for annual Prime Day event',
      '{ticker} hires 50,000 seasonal workers for holiday rush',
      'Amazon opens new fulfilment centre in Tennessee',
    ],
  },
  META: {
    bullish: [
      '{name} reports 25% increase in daily active users',
      '{ticker} Reality Labs cuts losses by 40% in latest quarter',
      'Meta AI assistant surpasses 500 million monthly users',
      '{name} Threads platform reaches profitability milestone',
      'Instagram Reels ad revenue surpasses TikTok in key markets',
    ],
    bearish: [
      '{name} faces data privacy lawsuit in European courts',
      '{ticker} metaverse investment draws shareholder criticism',
      'Meta loses key advertisers amid brand safety concerns',
      '{name} Reality Labs burns $4B in latest quarter',
    ],
    neutral: [
      '{name} hosts annual Connect developer conference',
      '{ticker} announces new content moderation policies',
      'Meta opens new AI research lab in London',
    ],
  },
  NVDA: {
    bullish: [
      '{name} next-gen GPU sells out within hours of launch',
      '{ticker} data centre revenue surges 120% on AI demand',
      'NVIDIA announces strategic partnership with major cloud providers',
      '{name} raises full-year guidance above Wall Street estimates',
      'Blackwell GPU architecture sets new performance benchmarks',
      '{ticker} secures dominant position in AI training hardware',
    ],
    bearish: [
      '{name} faces US export restrictions on AI chips to China',
      '{ticker} supply constraints limit near-term revenue potential',
      'NVIDIA warns of potential inventory correction in gaming',
      'Competition heats up as AMD unveils rival AI accelerator',
    ],
    neutral: [
      '{name} CEO Jensen Huang delivers GTC keynote address',
      '{ticker} included in Dow Jones Industrial Average',
      'NVIDIA releases new CUDA toolkit for developers',
    ],
  },
};

/** Market-wide headlines (not tied to any specific stock). */
const MARKET_HEADLINES = {
  bullish: [
    'Fed signals potential rate cut in upcoming meeting, markets rally',
    'S&P 500 closes at new all-time high amid broad tech gains',
    'US jobs report beats expectations, unemployment at 3.5%',
    'Consumer confidence index rises to highest level in 2 years',
    'Global markets rally as trade tensions ease',
    'Tech sector leads market higher on strong earnings season',
  ],
  bearish: [
    'Treasury yields spike above 5%, pressuring equity valuations',
    'Inflation data comes in hotter than expected, rate cut hopes fade',
    'Global markets dip on geopolitical uncertainty in Middle East',
    'VIX volatility index spikes to 6-month high',
    'Recession indicators flash warning as yield curve inverts again',
    'Oil prices surge 8% on OPEC production cuts',
  ],
  neutral: [
    'Markets await Federal Reserve policy decision due Wednesday',
    'Earnings season kicks off with major banks reporting this week',
    'Trading volume falls to yearly low ahead of holiday weekend',
    'SEC proposes new disclosure rules for AI usage in trading',
    'Asian markets mixed in overnight trading',
  ],
};

class NewsGenerator extends EventEmitter {
  constructor() {
    super();
    this._timeoutId = null;
    this._recentHeadlines = new Set(); // Prevent immediate repetition
  }

  /** Start generating news at random intervals. */
  start() {
    console.log('[NewsGen] Starting market news generator');
    this._scheduleNext();
  }

  /** Stop generating news. */
  stop() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  /** @private */
  _scheduleNext() {
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    this._timeoutId = setTimeout(() => {
      this._generateHeadline();
      this._scheduleNext();
    }, delay);
  }

  /** @private */
  _generateHeadline() {
    // 60% chance stock-specific, 40% chance market-wide
    const isStockSpecific = Math.random() < 0.6;

    // Weighted sentiment: 40% bullish, 30% bearish, 30% neutral
    const sentimentRoll = Math.random();
    const sentiment =
      sentimentRoll < 0.4 ? 'bullish' :
      sentimentRoll < 0.7 ? 'bearish' : 'neutral';

    let headline, ticker;

    if (isStockSpecific) {
      ticker = SUPPORTED_TICKERS[Math.floor(Math.random() * SUPPORTED_TICKERS.length)];
      const templates = STOCK_HEADLINES[ticker][sentiment];
      let template = templates[Math.floor(Math.random() * templates.length)];

      // Avoid immediate repetition
      let attempts = 0;
      while (this._recentHeadlines.has(template) && attempts < 5) {
        template = templates[Math.floor(Math.random() * templates.length)];
        attempts++;
      }

      headline = template
        .replace(/\{name\}/g, STOCKS[ticker].name)
        .replace(/\{ticker\}/g, ticker);
    } else {
      ticker = null;
      const templates = MARKET_HEADLINES[sentiment];
      headline = templates[Math.floor(Math.random() * templates.length)];
    }

    // Track recent headlines (keep last 10)
    this._recentHeadlines.add(headline);
    if (this._recentHeadlines.size > 10) {
      const first = this._recentHeadlines.values().next().value;
      this._recentHeadlines.delete(first);
    }

    const newsItem = {
      id: uuidv4(),
      headline,
      sentiment,
      ticker,
      source: isStockSpecific ? 'Company News' : 'Market Update',
      timestamp: new Date().toISOString(),
    };

    this.emit('news', newsItem);
  }
}

const newsGenerator = new NewsGenerator();
export default newsGenerator;
