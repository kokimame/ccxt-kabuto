'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { AddressPending, AuthenticationError, ExchangeError, NotSupported, PermissionDenied, ArgumentsRequired } = require ('./base/errors');
const Precise = require ('./base/Precise');

//  ---------------------------------------------------------------------------

module.exports = class buda extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'buda',
            'name': 'Buda',
            'countries': [ 'AR', 'CL', 'CO', 'PE' ],
            'rateLimit': 1000,
            'version': 'v2',
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'addMargin': false,
                'cancelOrder': true,
                'createDepositAddress': true,
                'createOrder': true,
                'createReduceOnlyOrder': false,
                'fetchBalance': true,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchDepositAddress': true,
                'fetchDeposits': true,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchLeverage': false,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': undefined,
                'fetchOHLCV': true,
                'fetchOpenInterestHistory': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchPosition': false,
                'fetchPositions': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchTicker': true,
                'fetchTrades': true,
                'fetchTradingFee': false,
                'fetchTradingFees': false,
                'fetchTransactionFees': true,
                'fetchTransfer': false,
                'fetchTransfers': false,
                'fetchWithdrawal': false,
                'fetchWithdrawals': true,
                'reduceMargin': false,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'transfer': false,
                'withdraw': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/47380619-8a029200-d706-11e8-91e0-8a391fe48de3.jpg',
                'api': 'https://www.buda.com/api',
                'www': 'https://www.buda.com',
                'doc': 'https://api.buda.com',
                'fees': 'https://www.buda.com/comisiones',
            },
            'status': {
                'status': 'error',
                'updated': undefined,
                'eta': undefined,
                'url': undefined,
            },
            'api': {
                'public': {
                    'get': [
                        'pairs',
                        'markets',
                        'currencies',
                        'markets/{market}',
                        'markets/{market}/ticker',
                        'markets/{market}/volume',
                        'markets/{market}/order_book',
                        'markets/{market}/trades',
                        'currencies/{currency}/fees/deposit',
                        'currencies/{currency}/fees/withdrawal',
                        'tv/history',
                    ],
                    'post': [
                        'markets/{market}/quotations',
                    ],
                },
                'private': {
                    'get': [
                        'balances',
                        'balances/{currency}',
                        'currencies/{currency}/balances',
                        'orders',
                        'orders/{id}',
                        'markets/{market}/orders',
                        'deposits',
                        'currencies/{currency}/deposits',
                        'withdrawals',
                        'currencies/{currency}/withdrawals',
                        'currencies/{currency}/receive_addresses',
                        'currencies/{currency}/receive_addresses/{id}',
                    ],
                    'post': [
                        'markets/{market}/orders',
                        'currencies/{currency}/deposits',
                        'currencies/{currency}/withdrawals',
                        'currencies/{currency}/simulated_withdrawals',
                        'currencies/{currency}/receive_addresses',
                    ],
                    'put': [
                        'orders/{id}',
                    ],
                },
            },
            'timeframes': {
                '1m': '1',
                '5m': '5',
                '30m': '30',
                '1h': '60',
                '2h': '120',
                '1d': 'D',
                '1w': 'W',
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': 0.008,  // 0.8%
                    'maker': 0.004,  // 0.4%
                    'tiers': {
                        'taker': [
                            [ 0, 0.008 ],  // 0.8%
                            [ 2000, 0.007 ],  // 0.7%
                            [ 20000, 0.006 ],  // 0.6%
                            [ 100000, 0.005 ],  // 0.5%
                            [ 500000, 0.004 ],  // 0.4%
                            [ 2500000, 0.003 ],  // 0.3%
                            [ 12500000, 0.002 ],  // 0.2%
                        ],
                        'maker': [
                            [ 0, 0.004 ],  // 0.4%
                            [ 2000, 0.0035 ],  // 0.35%
                            [ 20000, 0.003 ],  // 0.3%
                            [ 100000, 0.0025 ],  // 0.25%
                            [ 500000, 0.002 ],  // 0.2%
                            [ 2500000, 0.0015 ],  // 0.15%
                            [ 12500000, 0.001 ],  // 0.1%
                        ],
                    },
                },
            },
            'exceptions': {
                'not_authorized': AuthenticationError,  // { message: 'Invalid credentials', code: 'not_authorized' }
                'forbidden': PermissionDenied,  // { message: 'You dont have access to this resource', code: 'forbidden' }
                'invalid_record': ExchangeError,  // { message: 'Validation Failed', code: 'invalid_record', errors: [] }
                'not_found': ExchangeError,  // { message: 'Not found', code: 'not_found' }
                'parameter_missing': ExchangeError,  // { message: 'Parameter missing', code: 'parameter_missing' }
                'bad_parameter': ExchangeError,  // { message: 'Bad Parameter format', code: 'bad_parameter' }
            },
        });
    }

    async fetchCurrencyInfo (currency, currencies = undefined) {
        if (!currencies) {
            const response = await this.publicGetCurrencies ();
            //
            //     {
            //         "currencies":[
            //             {
            //                 "id":"BTC",
            //                 "symbol":"฿",
            //                 "managed":true,
            //                 "input_decimals":8,
            //                 "display_decimals":8,
            //                 "timezone":"UTC",
            //                 "deposit_minimum":["0.0","BTC"],
            //                 "withdrawal_minimum":["0.00001","BTC"],
            //                 "max_digits_for_decimals":6,
            //                 "crypto":true,
            //                 "address_explorer":"https://blockchair.com/bitcoin/address/",
            //                 "tx_explorer":"https://blockchair.com/bitcoin/transaction/",
            //                 "amount_to_micro_multiplier":1000000000000
            //             }
            //         ]
            //     }
            //
            currencies = this.safeValue (response, 'currencies');
        }
        for (let i = 0; i < currencies.length; i++) {
            const currencyInfo = currencies[i];
            if (currencyInfo['id'] === currency) {
                return currencyInfo;
            }
        }
        return undefined;
    }

    async fetchMarkets (params = {}) {
        /**
         * @method
         * @name buda#fetchMarkets
         * @description retrieves data on all markets for buda
         * @param {dict} params extra parameters specific to the exchange api endpoint
         * @returns {[dict]} an array of objects representing market data
         */
        const marketsResponse = await this.publicGetMarkets (params);
        const markets = this.safeValue (marketsResponse, 'markets', []);
        const currenciesResponse = await this.publicGetCurrencies ();
        const currencies = this.safeValue (currenciesResponse, 'currencies');
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            const baseId = this.safeString (market, 'base_currency');
            const quoteId = this.safeString (market, 'quote_currency');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const baseInfo = await this.fetchCurrencyInfo (baseId, currencies);
            const quoteInfo = await this.fetchCurrencyInfo (quoteId, currencies);
            const pricePrecisionString = this.safeString (quoteInfo, 'input_decimals');
            const minimumOrderAmount = this.safeValue (market, 'minimum_order_amount', []);
            result.push ({
                'id': this.safeString (market, 'id'),
                'symbol': base + '/' + quote,
                'base': base,
                'quote': quote,
                'settle': undefined,
                'baseId': baseId,
                'quoteId': quoteId,
                'settleId': undefined,
                'type': 'spot',
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'active': true,
                'contract': false,
                'linear': undefined,
                'inverse': undefined,
                'contractSize': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'precision': {
                    'amount': this.safeInteger (baseInfo, 'input_decimals'),
                    'price': parseInt (pricePrecisionString),
                },
                'limits': {
                    'leverage': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'amount': {
                        'min': this.safeNumber (minimumOrderAmount, 0),
                        'max': undefined,
                    },
                    'price': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    async fetchCurrencies (params = {}) {
        /**
         * @method
         * @name buda#fetchCurrencies
         * @description fetches all available currencies on an exchange
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {dict} an associative dictionary of currencies
         */
        const response = await this.publicGetCurrencies ();
        //
        //     {
        //         "currencies":[
        //             {
        //                 "id":"BTC",
        //                 "symbol":"฿",
        //                 "managed":true,
        //                 "input_decimals":8,
        //                 "display_decimals":8,
        //                 "timezone":"UTC",
        //                 "deposit_minimum":["0.0","BTC"],
        //                 "withdrawal_minimum":["0.00001","BTC"],
        //                 "max_digits_for_decimals":6,
        //                 "crypto":true,
        //                 "address_explorer":"https://blockchair.com/bitcoin/address/",
        //                 "tx_explorer":"https://blockchair.com/bitcoin/transaction/",
        //                 "amount_to_micro_multiplier":1000000000000
        //             }
        //         ]
        //     }
        //
        const currencies = response['currencies'];
        const result = {};
        for (let i = 0; i < currencies.length; i++) {
            const currency = currencies[i];
            const managed = this.safeValue (currency, 'managed', false);
            if (!managed) {
                continue;
            }
            const id = this.safeString (currency, 'id');
            const code = this.safeCurrencyCode (id);
            const precision = this.safeNumber (currency, 'input_decimals');
            const minimum = Math.pow (10, -precision);
            const depositMinimum = this.safeValue (currency, 'deposit_minimum', []);
            const withdrawalMinimum = this.safeValue (currency, 'withdrawal_minimum', []);
            const minDeposit = this.safeNumber (depositMinimum, 0);
            const minWithdraw = this.safeNumber (withdrawalMinimum, 0);
            result[code] = {
                'id': id,
                'code': code,
                'info': currency,
                'name': undefined,
                'active': true,
                'deposit': undefined,
                'withdraw': undefined,
                'fee': undefined,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': minimum,
                        'max': undefined,
                    },
                    'deposit': {
                        'min': minDeposit,
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': minWithdraw,
                    },
                },
            };
        }
        return result;
    }

    async fetchTransactionFees (codes = undefined, params = {}) {
        //  by default it will try load withdrawal fees of all currencies (with separate requests)
        //  however if you define codes = [ 'ETH', 'BTC' ] in args it will only load those
        await this.loadMarkets ();
        const withdrawFees = {};
        const depositFees = {};
        const info = {};
        if (codes === undefined) {
            codes = Object.keys (this.currencies);
        }
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            const currency = this.currency (code);
            const request = { 'currency': currency['id'] };
            const withdrawResponse = await this.publicGetCurrenciesCurrencyFeesWithdrawal (request);
            const depositResponse = await this.publicGetCurrenciesCurrencyFeesDeposit (request);
            withdrawFees[code] = this.parseFundingFee (withdrawResponse['fee']);
            depositFees[code] = this.parseFundingFee (depositResponse['fee']);
            info[code] = {
                'withdraw': withdrawResponse,
                'deposit': depositResponse,
            };
        }
        return {
            'withdraw': withdrawFees,
            'deposit': depositFees,
            'info': info,
        };
    }

    parseFundingFee (fee, type = undefined) {
        if (type === undefined) {
            type = fee['name'];
        }
        if (type === 'withdrawal') {
            type = 'withdraw';
        }
        return {
            'type': type,
            'currency': fee['base'][1],
            'rate': fee['percent'],
            'cost': parseFloat (fee['base'][0]),
        };
    }

    async fetchTicker (symbol, params = {}) {
        /**
         * @method
         * @name buda#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {str} symbol unified symbol of the market to fetch the ticker for
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {dict} a [ticker structure]{@link https://docs.ccxt.com/en/latest/manual.html#ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'market': market['id'],
        };
        const response = await this.publicGetMarketsMarketTicker (this.extend (request, params));
        //
        //     {
        //         "ticker":{
        //             "market_id":"ETH-BTC",
        //             "last_price":["0.07300001","BTC"],
        //             "min_ask":["0.07716895","BTC"],
        //             "max_bid":["0.0754966","BTC"],
        //             "volume":["0.168965697","ETH"],
        //             "price_variation_24h":"-0.046",
        //             "price_variation_7d":"-0.085"
        //         }
        //     }
        //
        const ticker = this.safeValue (response, 'ticker');
        return this.parseTicker (ticker, market);
    }

    parseTicker (ticker, market = undefined) {
        //
        // fetchTicker
        //
        //     {
        //         "market_id":"ETH-BTC",
        //         "last_price":["0.07300001","BTC"],
        //         "min_ask":["0.07716895","BTC"],
        //         "max_bid":["0.0754966","BTC"],
        //         "volume":["0.168965697","ETH"],
        //         "price_variation_24h":"-0.046",
        //         "price_variation_7d":"-0.085"
        //     }
        //
        const timestamp = this.milliseconds ();
        const marketId = this.safeString (ticker, 'market_id');
        const symbol = this.safeSymbol (marketId, market, '-');
        const lastPrice = this.safeValue (ticker, 'last_price', []);
        const last = this.safeString (lastPrice, 0);
        let percentage = this.safeString (ticker, 'price_variation_24h');
        percentage = Precise.stringMul (percentage, '100');
        const maxBid = this.safeValue (ticker, 'max_bid', []);
        const minAsk = this.safeValue (ticker, 'min_ask', []);
        const baseVolume = this.safeValue (ticker, 'volume', []);
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': undefined,
            'low': undefined,
            'bid': this.safeString (maxBid, 0),
            'bidVolume': undefined,
            'ask': this.safeString (minAsk, 0),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': percentage,
            'average': undefined,
            'baseVolume': this.safeString (baseVolume, 0),
            'quoteVolume': undefined,
            'info': ticker,
        }, market);
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name buda#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @param {str} symbol unified symbol of the market to fetch trades for
         * @param {int|undefined} since timestamp in ms of the earliest trade to fetch
         * @param {int|undefined} limit the maximum amount of trades to fetch
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {[dict]} a list of [trade structures]{@link https://docs.ccxt.com/en/latest/manual.html?#public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'market': market['id'],
        };
        // the since argument works backwards – returns trades up to the specified timestamp
        // therefore not implemented here
        // the method is still available for users to be able to traverse backwards in time
        // by using the timestamp from the first received trade upon each iteration
        if (limit !== undefined) {
            request['limit'] = limit; // 50 max
        }
        const response = await this.publicGetMarketsMarketTrades (this.extend (request, params));
        //
        //     { trades: {      market_id:   "ETH-BTC",
        //                      timestamp:    null,
        //                 last_timestamp:   "1536901277302",
        //                        entries: [ [ "1540077456791", "0.0063767", "0.03", "sell", 479842 ],
        //                                   [ "1539916642772", "0.01888263", "0.03019563", "sell", 479438 ],
        //                                   [ "1539834081787", "0.023718648", "0.031001", "sell", 479069 ],
        //                                   ... ]
        //
        return this.parseTrades (response['trades']['entries'], market, since, limit);
    }

    parseTrade (trade, market = undefined) {
        //
        // fetchTrades (public)
        //  [ "1540077456791", "0.0063767", "0.03", "sell", 479842 ]
        //
        let timestamp = undefined;
        let side = undefined;
        const type = undefined;
        let priceString = undefined;
        let amountString = undefined;
        let id = undefined;
        const order = undefined;
        const fee = undefined;
        let symbol = undefined;
        if (market) {
            symbol = market['symbol'];
        }
        if (Array.isArray (trade)) {
            timestamp = this.safeInteger (trade, 0);
            priceString = this.safeString (trade, 1);
            amountString = this.safeString (trade, 2);
            side = this.safeString (trade, 3);
            id = this.safeString (trade, 4);
        }
        return this.safeTrade ({
            'id': id,
            'order': order,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': type,
            'side': side,
            'takerOrMaker': undefined,
            'price': priceString,
            'amount': amountString,
            'cost': undefined,
            'fee': fee,
        }, market);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        /**
         * @method
         * @name buda#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {str} symbol unified symbol of the market to fetch the order book for
         * @param {int|undefined} limit the maximum amount of order book entries to return
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {dict} A dictionary of [order book structures]{@link https://docs.ccxt.com/en/latest/manual.html#order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'market': market['id'],
        };
        const response = await this.publicGetMarketsMarketOrderBook (this.extend (request, params));
        const orderbook = this.safeValue (response, 'order_book');
        return this.parseOrderBook (orderbook, symbol);
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name buda#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @param {str} symbol unified symbol of the market to fetch OHLCV data for
         * @param {str} timeframe the length of time each candle represents
         * @param {int|undefined} since timestamp in ms of the earliest candle to fetch
         * @param {int|undefined} limit the maximum amount of candles to fetch
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {[[int]]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (since === undefined) {
            since = this.milliseconds () - 86400000;
        }
        const request = {
            'symbol': market['id'],
            'resolution': this.timeframes[timeframe],
            'from': since / 1000,
            'to': this.seconds (),
        };
        const response = await this.publicGetTvHistory (this.extend (request, params));
        return this.parseTradingViewOHLCV (response, market, timeframe, since, limit);
    }

    parseBalance (response) {
        const result = { 'info': response };
        const balances = this.safeValue (response, 'balances', []);
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'id');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString (balance['available_amount'], 0);
            account['total'] = this.safeString (balance['amount'], 0);
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async fetchBalance (params = {}) {
        /**
         * @method
         * @name buda#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @param {dict} params extra parameters specific to the buda api endpoint
         * @returns {dict} a [balance structure]{@link https://docs.ccxt.com/en/latest/manual.html?#balance-structure}
         */
        await this.loadMarkets ();
        const response = await this.privateGetBalances (params);
        return this.parseBalance (response);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'id': parseInt (id),
        };
        const response = await this.privateGetOrdersId (this.extend (request, params));
        const order = this.safeValue (response, 'order');
        return this.parseOrder (order);
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const request = {
            'market': market['id'],
            'per': limit,
        };
        const response = await this.privateGetMarketsMarketOrders (this.extend (request, params));
        const orders = this.safeValue (response, 'orders');
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'state': 'pending',
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'state': 'traded',
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        side = (side === 'buy') ? 'Bid' : 'Ask';
        const request = {
            'market': this.marketId (symbol),
            'price_type': type,
            'type': side,
            'amount': this.amountToPrecision (symbol, amount),
        };
        if (type === 'limit') {
            request['limit'] = this.priceToPrecision (symbol, price);
        }
        const response = await this.privatePostMarketsMarketOrders (this.extend (request, params));
        const order = this.safeValue (response, 'order');
        return this.parseOrder (order);
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'id': parseInt (id),
            'state': 'canceling',
        };
        const response = await this.privatePutOrdersId (this.extend (request, params));
        const order = this.safeValue (response, 'order');
        return this.parseOrder (order);
    }

    parseOrderStatus (status) {
        const statuses = {
            'traded': 'closed',
            'received': 'open',
            'canceling': 'canceled',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        //
        //     {
        //         'id': 63679183,
        //         'uuid': 'f9697bee-627e-4175-983f-0d5a41963fec',
        //         'market_id': 'ETH-CLP',
        //         'account_id': 51590,
        //         'type': 'Ask',
        //         'state': 'received',
        //         'created_at': '2021-01-04T08:29:52.730Z',
        //         'fee_currency': 'CLP',
        //         'price_type': 'limit',
        //         'source': None,
        //         'limit': ['741000.0', 'CLP'],
        //         'amount': ['0.001', 'ETH'],
        //         'original_amount': ['0.001', 'ETH'],
        //         'traded_amount': ['0.0', 'ETH'],
        //         'total_exchanged': ['0.0', 'CLP'],
        //         'paid_fee': ['0.0', 'CLP']
        //     }
        //
        const id = this.safeString (order, 'id');
        const timestamp = this.parse8601 (this.safeString (order, 'created_at'));
        const datetime = this.iso8601 (timestamp);
        const marketId = this.safeString (order, 'market_id');
        const symbol = this.safeSymbol (marketId, market, '-');
        const type = this.safeString (order, 'price_type');
        const side = this.safeStringLower (order, 'type');
        const status = this.parseOrderStatus (this.safeString (order, 'state'));
        const originalAmount = this.safeValue (order, 'original_amount', []);
        const amount = this.safeString (originalAmount, 0);
        const remainingAmount = this.safeValue (order, 'amount', []);
        const remaining = this.safeString (remainingAmount, 0);
        const tradedAmount = this.safeValue (order, 'traded_amount', []);
        const filled = this.safeString (tradedAmount, 0);
        const totalExchanged = this.safeValue (order, 'totalExchanged', []);
        const cost = this.safeString (totalExchanged, 0);
        const limitPrice = this.safeValue (order, 'limit', []);
        let price = this.safeString (limitPrice, 0);
        if (price === undefined) {
            if (limitPrice !== undefined) {
                price = limitPrice;
            }
        }
        const paidFee = this.safeValue (order, 'paid_fee', []);
        const feeCost = this.safeString (paidFee, 0);
        let fee = undefined;
        if (feeCost !== undefined) {
            const feeCurrencyId = this.safeString (paidFee, 1);
            const feeCurrencyCode = this.safeCurrencyCode (feeCurrencyId);
            fee = {
                'cost': feeCost,
                'code': feeCurrencyCode,
            };
        }
        return this.safeOrder ({
            'info': order,
            'id': id,
            'clientOrderId': undefined,
            'datetime': datetime,
            'timestamp': timestamp,
            'lastTradeTimestamp': undefined,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'average': undefined,
            'cost': cost,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'trades': undefined,
            'fee': fee,
        }, market);
    }

    isFiat (code) {
        const fiats = {
            'ARS': true,
            'CLP': true,
            'COP': true,
            'PEN': true,
        };
        return this.safeValue (fiats, code, false);
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        if (this.isFiat (code)) {
            throw new NotSupported (this.id + ' fetchDepositAddress() for fiat ' + code + ' is not supported');
        }
        const request = {
            'currency': currency['id'],
        };
        const response = await this.privateGetCurrenciesCurrencyReceiveAddresses (this.extend (request, params));
        const receiveAddresses = this.safeValue (response, 'receive_addresses');
        const addressPool = [];
        for (let i = 1; i < receiveAddresses.length; i++) {
            const receiveAddress = receiveAddresses[i];
            if (receiveAddress['ready']) {
                const address = receiveAddress['address'];
                this.checkAddress (address);
                addressPool.push (address);
            }
        }
        const addressPoolLength = addressPool.length;
        if (addressPoolLength < 1) {
            throw new AddressPending (this.id + ': there are no addresses ready for receiving ' + code + ', retry again later)');
        }
        const address = addressPool[0];
        return {
            'currency': code,
            'address': address,
            'tag': undefined,
            'network': undefined,
            'info': receiveAddresses,
        };
    }

    async createDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        if (this.isFiat (code)) {
            throw new NotSupported (this.id + ' createDepositAddress() of fiat for ' + code + ' is not supported');
        }
        const request = {
            'currency': currency['id'],
        };
        const response = await this.privatePostCurrenciesCurrencyReceiveAddresses (this.extend (request, params));
        const address = this.safeString (response['receive_address'], 'address');  // the creation is async and returns a null address, returns only the id
        return {
            'currency': code,
            'address': address,
            'tag': undefined,
            'info': response,
        };
    }

    parseTransactionStatus (status) {
        const statuses = {
            'rejected': 'failed',
            'confirmed': 'ok',
            'anulled': 'canceled',
            'retained': 'canceled',
            'pending_confirmation': 'pending',
        };
        return this.safeString (statuses, status, status);
    }

    parseTransaction (transaction, currency = undefined) {
        const id = this.safeString (transaction, 'id');
        const timestamp = this.parse8601 (this.safeString (transaction, 'created_at'));
        const currencyId = this.safeString (transaction, 'currency');
        const code = this.safeCurrencyCode (currencyId, currency);
        const amount = parseFloat (transaction['amount'][0]);
        const fee = parseFloat (transaction['fee'][0]);
        const feeCurrency = transaction['fee'][1];
        const status = this.parseTransactionStatus (this.safeString (transaction, 'state'));
        const type = ('deposit_data' in transaction) ? 'deposit' : 'withdrawal';
        const data = this.safeValue (transaction, type + '_data', {});
        const address = this.safeValue (data, 'target_address');
        const txid = this.safeString (data, 'tx_hash');
        const updated = this.parse8601 (this.safeString (data, 'updated_at'));
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'network': undefined,
            'address': address,
            'addressTo': undefined,
            'addressFrom': undefined,
            'tag': undefined,
            'tagTo': undefined,
            'tagFrom': undefined,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': updated,
            'fee': {
                'cost': fee,
                'rate': feeCurrency,
            },
        };
    }

    async fetchDeposits (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        if (code === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchDeposits() requires a currency code argument');
        }
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
            'per': limit,
        };
        const response = await this.privateGetCurrenciesCurrencyDeposits (this.extend (request, params));
        const deposits = this.safeValue (response, 'deposits');
        return this.parseTransactions (deposits, currency, since, limit);
    }

    async fetchWithdrawals (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        if (code === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchWithdrawals() requires a currency code argument');
        }
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
            'per': limit,
        };
        const response = await this.privateGetCurrenciesCurrencyWithdrawals (this.extend (request, params));
        const withdrawals = this.safeValue (response, 'withdrawals');
        return this.parseTransactions (withdrawals, currency, since, limit);
    }

    async withdraw (code, amount, address, tag = undefined, params = {}) {
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        this.checkAddress (address);
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
            'amount': amount,
            'withdrawal_data': {
                'target_address': address,
            },
        };
        const response = await this.privatePostCurrenciesCurrencyWithdrawals (this.extend (request, params));
        const withdrawal = this.safeValue (response, 'withdrawal');
        return this.parseTransaction (withdrawal);
    }

    nonce () {
        return this.microseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let request = this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (Object.keys (query).length) {
            if (method === 'GET') {
                request += '?' + this.urlencode (query);
            } else {
                body = this.json (query);
            }
        }
        const url = this.urls['api'] + '/' + this.version + '/' + request;
        if (api === 'private') {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ().toString ();
            const components = [ method, '/api/' + this.version + '/' + request ];
            if (body) {
                const base64Body = this.stringToBase64 (body);
                components.push (this.decode (base64Body));
            }
            components.push (nonce);
            const message = components.join (' ');
            const signature = this.hmac (this.encode (message), this.encode (this.secret), 'sha384');
            headers = {
                'X-SBTC-APIKEY': this.apiKey,
                'X-SBTC-SIGNATURE': signature,
                'X-SBTC-NONCE': nonce,
                'Content-Type': 'application/json',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return; // fallback to default error handler
        }
        if (code >= 400) {
            const errorCode = this.safeString (response, 'code');
            const message = this.safeString (response, 'message', body);
            const feedback = this.id + ' ' + message;
            if (errorCode !== undefined) {
                this.throwExactlyMatchedException (this.exceptions, errorCode, feedback);
                throw new ExchangeError (feedback);
            }
        }
    }
};
