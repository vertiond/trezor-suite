import type { LastWeekRates, TimestampedRates, TickerId } from '@wallet-types/fiatRates';

const ENDPOINTS = {
    btc: 'btc1',
};

type Ticker = keyof typeof ENDPOINTS;

type TickersQuery = {
    currency?: string;
    timestamp?: number;
};

const queryToString = (query?: TickersQuery) =>
    Object.entries(query || {})
        .filter(([, val]) => val !== undefined)
        .map(([key, val]) => `${key}=${val}`)
        .join('&');

const buildUrl = (ticker: Ticker, query?: TickersQuery) =>
    `https://${ENDPOINTS[ticker]}.trezor.io/api/v2/tickers/?${queryToString(query)}`;

export const isTickerSupported = (ticker: TickerId): ticker is TickerId & { symbol: Ticker } =>
    !!ENDPOINTS[ticker.symbol as Ticker];

const request = (url: string): Promise<TimestampedRates | null> =>
    fetch(url)
        .then(res =>
            res.ok
                ? res.json()
                : Promise.reject(new Error(`Fiat rates failed to fetch: ${res.status}`)),
        )
        .catch(err => {
            console.warn(err);
            return null;
        });

const fetchSingle = (ticker: Ticker, query?: TickersQuery) => {
    const url = buildUrl(ticker, query);
    return request(url);
};

const fetchMulti = async (
    ticker: Ticker,
    timestamps: number[],
    currency?: string,
): Promise<LastWeekRates> => {
    const rates = await Promise.all(
        timestamps.map(timestamp =>
            fetchSingle(ticker, { timestamp, currency }).then(res => ({
                ts: timestamp,
                rates: res?.rates ?? {},
            })),
        ),
    );
    return {
        ts: new Date().getTime(),
        symbol: ticker,
        tickers: rates,
    };
};

const getLastWeekTimestamps = () =>
    Array.from(Array(7).keys()).map(i => {
        const date = new Date();
        date.setDate(date.getDate() - 7 + i);
        return Math.floor(date.getTime() / 1000);
    });

export const fetchCurrentFiatRates = fetchSingle;

export const getFiatRatesForTimestamps = fetchMulti;

export const fetchLastWeekRates = (ticker: Ticker, currency: string) =>
    fetchMulti(ticker, getLastWeekTimestamps(), currency);
