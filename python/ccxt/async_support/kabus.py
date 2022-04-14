# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxt.async_support.base.exchange import Exchange
import json
from ccxt.base.errors import ExchangeError


class kabus(Exchange):

    def describe(self):
        return self.deep_extend(super(kabus, self).describe(), {
            'id': 'kabus',
            'name': 'Kabus',
            'countries': ['JP'],
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
                'CORS': None,
                'spot': True,
                'margin': None,
                'swap': None,
                'future': None,
                'option': None,
                'fetchOrderBook': True,
                'fetchTicker': True,
            },
            'precision': {
                'amount': None,
                'price': None,
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
                'ipaddr': True,
                'password': False,
                'apiKey': False,
                'secret': False,
                'uid': False,
                'login': False,
                'twofa': False,  # 2-factor authentication(one-time password key)
                'privateKey': False,  # a "0x"-prefixed hexstring private key for a wallet
                'walletAddress': False,  # the wallet address "0x"-prefixed hexstring
                'token': False,  # reserved for HTTP auth in some cases
            },
        })

    async def fetch_markets(self, params={}):
        # Returns a list of stock code and its basic properties for trading
        # No API access for now
        markets = [
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
        ]
        result = []
        for i in range(0, len(markets)):
            result.append({
                'id': i,
                'symbol': markets[i] + '/JPY',
                'base': 'JPY',
                'quote': 'JPY',
                'maker': 0.001,
                'taker': 0.001,
                'active': True,
                'min_unit': 100,
                # value limits when placing orders on self market
                'limits': {
                    'amount': {
                        # order amount should be > min
                        'min': 100,
                        # order amount should be < max
                        'max': 100000000,
                    },
                    'price': {
                        'min': 100,
                        'max': 100000000,
                    },
                    # order cost = price * amount
                    'cost': {
                        'min': 0,
                        'max': 100000000,
                    },
                },
            })
        return result

    async def fetch_trades(self, symbol, since=None, limit=None, params={}):
        await self.load_markets()
        return []

    async def fetch_ticker(self, symbol, params={}):
        await self.load_markets()
        request = {
            'symbol': symbol,
        }
        return self.publicGetBoardSymbol(self.extend(request, params))

    async def fetch_order_book(self, symbol, limit=None, params={}):
        ticker = await self.fetch_ticker(symbol, params)
        keys = list(ticker.keys())
        buys = []
        sells = []
        for i in range(0, len(keys)):
            key = keys[i]
            if key.find('Buy') == 0:
                buys.append([ticker[key]['Price'], ticker[key]['Qty']])
            if key.find('Sell') == 0:
                sells.append([ticker[key]['Price'], ticker[key]['Qty']])
        orderbook = {'bids': buys, 'asks': sells}
        return self.parse_order_book(orderbook, symbol)

    def fetch_token(self):
        url = self.implode_params(self.urls['api'], {'ipaddr': self.ipaddr}) + '/token'
        headers = {
            'Content-Type': 'application/json',
        }
        # json.loads() is needed to load json module in transpiled Python script
        body = json.dumps({'APIPassword': self.password})
        response = self.fetch(url, 'POST', headers, body)
        if response['ResultCode'] == '0':
            return response['Token']
        else:
            # Temporary placeholder for exception when it fails to get a new token
            raise ExchangeError()

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        self.check_required_credentials()
        if not self.apiKey:
            self.apiKey = self.fetch_token()
        request = '/' + self.implode_params(path, params)
        url = self.implode_params(self.urls['api'], {'ipaddr': self.ipaddr}) + request
        headers = {
            'X-API-KEY': self.apiKey,
            'Content-Type': 'application/json',
        }
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

    async def fetch_ohlcv(self, symbol, timeframe='1m', since=None, limit=None, params={}):
        # ohlcvs = await self.fetch_ohlcvc(symbol, timeframe, since, limit, params)
        async def update_ohlcvs():
            with open('kabuto_price.json', 'r') as f:
                dummy_data = json.load(f)

            self.dummy_data = dummy_data
            ohlcvs = dummy_data[symbol]
            return ohlcvs

        ohlcvs = await update_ohlcvs()
        return [ohlcv[0:-1] for ohlcv in ohlcvs]