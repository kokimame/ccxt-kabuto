'use strict';

const Exchange = require ('./base/Exchange');
const { ExchangeError } = require ('./base/errors');

module.exports = class kabus extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'kabus',
            'name': 'Kabus',
            'countries': [ 'JP' ],
            'version': 'v1',
            'rateLimit': 1000,
            'timeframes': {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            },
            'urls': {
                'logo': 'https://pbs.twimg.com/profile_images/1476235905375813633/-jRNbwhv_400x400.jpg',
                'api': 'http://{ipaddr}/live/kabusapi',
                'www': 'https://twitter.com/KabutoTheBot',
                'doc': 'https://twitter.com/KabutoTheBot',
            },
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': undefined,
                'swap': undefined,
                'future': undefined,
                'option': undefined,
                'fetchBalance': true,
                'fetchOHLCV': true,
                'fetchOrderBook': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'registerWhitelist': true,
                'createOrder': true,
            },
            'precision': {
                'amount': -2,
                'price': undefined,
            },
            'api': {
                'public': {
                    'get': [
                        'board/{symbol}',
                    ],
                    'post': [
                        'token',
                    ],
                    'put': [
                        'register',
                    ],
                },
                'private': {
                    'get': [
                        'wallet/cash',
                    ],
                },
            },
            'requiredCredentials': {
                'ipaddr': true,
                'password': false,
                'apiKey': false,
                'secret': false,
                'uid': false,
                'login': false,
                'twofa': false, // 2-factor authentication (one-time password key)
                'privateKey': false, // a "0x"-prefixed hexstring private key for a wallet
                'walletAddress': false, // the wallet address "0x"-prefixed hexstring
                'token': false, // reserved for HTTP auth in some cases
            },
            'fees': {
                'trading': {
                    'maker': this.parseNumber ('0.0'),
                    'taker': this.parseNumber ('0.0'),
                },
            },
        });
    }

    async fetchMarkets (params = {}) {
        // Return a list of stock code and its basic properties for trading
        // No API access for now
        const markets = [
            '8306@1',
            '4689@1',
            '6501@1',
            '3826@1',
            '5020@1',
            '3632@1',
            '5191@1',
            '6440@1',
            '8897@1',
            '167060018@24',
        ];
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            result.push ({
                'id': i,
                'symbol': markets[i] + '/JPY',
                'base': 'JPY',
                'quote': 'JPY',
                'maker': 0.001,
                'taker': 0.001,
                'active': true,
                'min_unit': 100,
                // value limits when placing orders on this market
                'limits': {
                    'amount': {
                        // order amount should be > min
                        'min': 100,
                        // order amount should be < max
                        'max': 100000000,
                    },
                    'price': {
                        'min': 100,
                        'max': 100000000,
                    },
                    // order cost = price * amount
                    'cost': {
                        'min': 0,
                        'max': 100000000,
                    },
                },
            });
        }
        return result;
    }

    parseBalance (response) {
        // Parse and organize balance information.
        const result = { 'info': response };
        const account = this.account ();
        account['free'] = this.safeFloat (response, 'StockAccountWallet');
        result['JPY'] = account;
        return result;
    }

    async fetchBalance (params = {}) {
        // Fetch account balance information
        await this.loadMarkets ();
        const response = await this.privateGetWalletCash (params);
        // {
        //      'StockAccountWallet': '497120.0'
        // }
        return this.parseBalance (response);
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        return [];
    }

    async fetchTicker (symbol, params = {}) {
        // Fetch board informatio of a single symbol.
        await this.loadMarkets ();
        symbol = symbol.slice (0, -4);
        const request = {
            'symbol': symbol,
        };
        return this.publicGetBoardSymbol (this.extend (request, params));
    }

    async fetchTickers (symbol, params = {}) {
        // Coming soon
        return null;
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        // Fetch order book information of a single symbol
        const ticker = await this.fetchTicker (symbol, params);
        const keys = Object.keys (ticker);
        const buys = [];
        const sells = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf ('Buy') === 0) {
                buys.push ([ ticker[key]['Price'], ticker[key]['Qty'] ]);
            }
            if (key.indexOf ('Sell') === 0) {
                sells.push ([ ticker[key]['Price'], ticker[key]['Qty'] ]);
            }
        }
        const orderbook = { 'bids': buys, 'asks': sells };
        return this.parseOrderBook (orderbook, symbol);
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        // Fetch latest OHLCV data of a single symbol from the local PriceServer
        symbol = symbol.slice (0, -4);
        const response = await this.fetch ('http://127.0.0.1:8999/charts/' + symbol + '/JPY/1m', 'GET');
        const ohlcvs = JSON.parse (response[symbol]);
        const data = [];
        for (let i = 0; i < ohlcvs.length; i++) {
            data.push (ohlcvs[i].slice (0, -1));
        }
        return data;
    }

    fetchToken () {
        // Fetch one-time access token for Kabus API
        const url = this.implodeParams (this.urls['api'], { 'ipaddr': this.ipaddr }) + '/token';
        const headers = {
            'Content-Type': 'application/json',
        };
        // JSON.parse() is needed to load json module in transpiled Python script
        const body = JSON.stringify ({ 'APIPassword': this.password });
        const response = this.fetch (url, 'POST', headers, body);
        if (response['ResultCode'] === '0') {
            return response['Token'];
        } else {
            // Temporary placeholder for exception when it fails to get a new token
            throw new ExchangeError ();
        }
    }

    parseTicker (pair) {
        // Parse ticker string to get symbol and exchange code
        const identifier = pair.split ('/')[0];
        const symbol = identifier.split ('@')[0];
        const exchange = parseInt (identifier.split ('@')[1]);
        return { 'Symbol': symbol, 'Exchange': exchange };
    }

    async registerWhitelist (whitelist) {
        // Register whitelist symbols.
        // FIXME: This cannnot be use from Worker due to the nature of the bot process.
        // PriceServer has a function for the same purpose and that is used instead.
        const symbols = { 'Symbols': [] };
        for (let i = 0; i < whitelist.length; i++) {
            const tickerVal = this.parseTicker (whitelist[i]);
            symbols['Symbols'].push (tickerVal);
        }
        const body = JSON.stringify (symbols);
        const response = this.fetch2 ('register', 'public', 'PUT', {}, undefined, body, {}, {});
        return response['RegistList'];
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        // Attach header and other necessary parameters to the API request.
        // This is called before a REST API request thrown to the server.
        // TODO: Handle differently 'public' call and 'private' call to improve security.
        this.checkRequiredCredentials ();
        if (!this.apiKey) {
            this.apiKey = this.fetchToken ();
        }
        const request = '/' + this.implodeParams (path, params);
        const url = this.implodeParams (this.urls['api'], { 'ipaddr': this.ipaddr }) + request;
        headers = {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
        };
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
};
