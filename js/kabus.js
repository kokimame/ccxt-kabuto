'use strict';

const Exchange = require ('./base/Exchange');

module.exports = class kabus extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'kabus',
            'name': 'Kabus',
            'countries': [ 'JP' ],
            'version': 'v1',
            'rateLimit': 1000,
            'hostname': '192.168.11.6:8070',
            'urls': {
                'logo': 'https://pbs.twimg.com/profile_images/1476235905375813633/-jRNbwhv_400x400.jpg',
                'api': 'http://{hostname}/live/kabusapi',
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
                'fetchTicker': true,
            },
            'api': {
                'public': {
                    'get': [
                        'board/{symbol}',
                    ],
                },
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

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const request = '/' + this.implodeParams (path, params);
        const url = this.implodeHostname (this.urls['api']) + request;
        headers = {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
        };
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
};
