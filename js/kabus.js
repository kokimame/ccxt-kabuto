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
                'fetchOrderBook': true,
                'fetchTicker': true,
            },
            'api': {
                'public': {
                    'get': [
                        'board/{symbol}',
                        '',
                    ],
                    'post': [
                        'token',
                    ],
                },
            },
            'requiredCredentials': {
                'ipaddr': true,
                'password': true,
                'apiKey': false,
                'secret': false,
                'uid': false,
                'login': false,
                'twofa': false, // 2-factor authentication (one-time password key)
                'privateKey': false, // a "0x"-prefixed hexstring private key for a wallet
                'walletAddress': false, // the wallet address "0x"-prefixed hexstring
                'token': false, // reserved for HTTP auth in some cases
            },
        });
    }

    async fetchMarkets (params = {}) {
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
            '167030018@24',
        ];
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            result.push ({
                'id': i,
                'symbol': markets[i],
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

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        const request = {
            'symbol': symbol,
        };
        return this.publicGetBoardSymbol (this.extend (request, params));
    }

    async fetchOrderBook (symbol, params = {}) {
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

    fetchToken () {
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

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
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
