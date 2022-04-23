'use strict';

const Exchange = require ('./base/Exchange');
const { ExchangeError, ArgumentsRequired, OrderNotFound } = require ('./base/errors');

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
                'createOrder': true,
                'fetchBalance': true,
                'fetchOHLCV': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'registerWhitelist': true,
            },
            'precision': {
                'amount': -2,
                'price': undefined,
            },
            'api': {
                'private': {
                    'get': [
                        'board/{symbol}',
                        'wallet/cash',
                        'orders',
                    ],
                    'post': [
                        'token',
                        'sendorder', // FIXME: Not used. Directly calling fetch2
                    ],
                    'put': [
                        'register', // FIXME: Not used. Directly calling fetch2
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

    sign (path, api = 'private', method = 'GET', params = {}, headers = undefined, body = undefined) {
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

    prepareOrder (pair, type, side, amount, price) {
        // 現物株式取引用のパラメタ設定
        const ticker = this.parseTicker (pair);
        if (type === 'market') {
            price = 0; // 成行執行→price=0
        }
        return {
            'Symbol': ticker['Symbol'],
            'Exchange': ticker['Exchange'],
            'Side': this.safeString ({ 'sell': '1', 'buy': '2' }, side),
            'DelivType': this.safeInteger ({ 'sell': 0, 'buy': 2 }, side), // 現物買→預り金
            'FundType': this.safeString ({ 'sell': '  ', 'buy': 'AA' }, side), // 現物買→信用代用
            'Qty': amount,
            'FrontOrderType': this.safeInteger ({ 'market': 10, 'limit': 20 }, type),
            'Price': price,
        };
    }

    async createOrder (pair, type, side, amount, price = undefined, params = {}) {
        // https://kabucom.github.io/kabusapi/reference/index.html#operation/sendorderPost
        await this.loadMarkets ();
        const orderParam = this.prepareOrder (pair, type, side, amount, price);
        const body = {
            'Password': this.kabusapi_password,             // 注文パスワード: <string>
            'Symbol': orderParam['Symbol'],                 // 銘柄コード: <string>
            'Exchange': orderParam['Exchange'],             // 市場コード: <int> 1 (東証), 3 (名証), 5 (福証), 6 (札証)
            'SecurityType': 1,                              // 商品種別: <int> 1 (株式)
            'Side': orderParam['Side'],                     // 売買区分: <string> 1 (売), 2 (買)
            'CashMargin': 1,                                // 信用区分: <int> 1 (現物), 2 (新規), 3 (返済)
            'DelivType': orderParam['DelivType'],           // 受渡区分: <int> 0 (指定なし), 1 (自動振替), 2 (預かり金) *現物買は必須/現物売は0
            'FundType': orderParam['FundType'],             // 資産区分: <string> '  ' (現物売), 02 (保護), AA (信用代用), 11 (信用取引) *現物買は必須/現物売はスペース2つ
            'AccountType': 2,                               // 口座種別: <int> 2 (一般), 4 (特定), 12 (法人)
            'Qty': orderParam['Qty'],                       // 注文数量: <int>
            'FrontOrderType': orderParam['FrontOrderType'], // 執行順序: <int> 10 (成行), 20 (指値) *他多数
            'Price': orderParam['Price'],                   // 注文価格: <int>
            'ExpireDay': 0,                                 // 注文有効期限: <int> *0=本日中
        };
        const body_str = JSON.stringify (body);
        const response = await this.fetch2 ('sendorder', 'private', 'POST', params, undefined, body_str, {}, {});
        // {'OrderId': '20220423A01N86096051', 'Result': 0}
        const id = this.safeString (response, 'OrderId');
        return {
            'info': response,
            'id': id,
        };
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

    parseOrder (order, market = undefined) {
        //     {'AccountType': 2,
        //       'CumQty': 0.0,
        //       'DelivType': 2,
        //       'Details': [{'Commission': 0.0,
        //                    'CommissionTax': 0.0,
        //                    'DelivDay': 20220427,
        //                    'ExchangeID': None,
        //                    'ExecutionDay': None,
        //                    'ExecutionID': None,
        //                    'ID': '20220423A01N86096041',
        //                    'OrdType': 1,
        //                    'Price': 0.0,
        //                    'Qty': 100.0,
        //                    'RecType': 1,
        //                    'SeqNum': 1,
        //                    'State': 3,
        //                    'TransactTime': '2022-04-23T14:31:16.652838+09:00'},
        //                   {'Commission': 0.0,
        //                    'CommissionTax': 0.0,
        //                    'DelivDay': 20220427,
        //                    'ExchangeID': None,
        //                    'ExecutionDay': None,
        //                    'ExecutionID': None,
        //                    'ID': '20220423B01N86096042',
        //                    'OrdType': 1,
        //                    'Price': 0.0,
        //                    'Qty': 100.0,
        //                    'RecType': 4,
        //                    'SeqNum': 2,
        //                    'State': 1,
        //                    'TransactTime': '2022-04-23T14:31:16.652838+09:00'}],
        //       'Exchange': 1,
        //       'ExchangeName': '東証ス',
        //       'ExpireDay': 20220425,
        //       'ID': '20220423A01N86096041',
        //       'OrdType': 1,
        //       'OrderQty': 100.0,
        //       'OrderState': 1,
        //       'Price': 0.0,
        //       'RecvTime': '2022-04-23T14:31:16.652838+09:00',
        //       'Side': '2',
        //       'State': 1,
        //       'Symbol': '9318',
        //       'SymbolName': 'アジア開発キャピタル'},
        //     }
        const id = this.safeString (order, 'ID');
        const price = this.safeFloat (order, 'Price');
        const amount = this.safeFloat (order, 'OrderQty');
        const cumQty = this.safeFloat (order, 'CumQty');
        const side = this.safeStringLower ({ '1': 'sell', '2': 'buy' }, order['Side']);
        const timestamp = this.parse8601 (this.safeString (order, 'RecvTime'));
        const symbol = this.safeString (order, 'Symbol');
        const exchange = this.safeString (order, 'Exchange');
        let order_type = 'limit';
        if (price === 0) {
            order_type = 'market';
        }
        // Order status is one of ['open', 'closed', 'canceled', 'expired', 'rejected']
        const n_details = order['Details'].length;
        if (n_details < 1) {
            throw new ExchangeError (this.id + ' expects to have at least 1 detail per order but 0 given');
        }
        const lastDetail = order['Details'][n_details - 1];
        // Get the latest state from the Details
        const status = this.safeString ({ '3': 'open', '5': 'closed' }, lastDetail['State']);
        return this.safeOrder ({
            'id': id,
            'clientOrderId': undefined,
            'info': order,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'status': status,
            'symbol': symbol + '@' + exchange + '/JPY',
            'type': order_type,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'cost': undefined,
            'amount': amount,
            'filled': cumQty,
            'remaining': amount - cumQty,
            'fee': undefined,
            'average': undefined,
            'trades': undefined,
        }, market);
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = 100, params = {}) {
        await this.loadMarkets ();
        params['product'] = 0;
        const response = await this.privateGetOrders (params);
        return this.parseOrders (response);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a `symbol` argument');
        }
        const orders = await this.fetchOrders (symbol);
        const ordersById = this.indexBy (orders, 'id');
        if (id in ordersById) {
            return ordersById[id];
        }
        throw new OrderNotFound (this.id + 'No order found with id ' + id);
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

    parseTicker (pair) {
        // Parse ticker string to get symbol and exchange code
        const identifier = pair.split ('/')[0];
        const symbol = identifier.split ('@')[0];
        const exchange = parseInt (identifier.split ('@')[1]);
        return { 'Symbol': symbol, 'Exchange': exchange };
    }

    async fetchTicker (symbol, params = {}) {
        // Fetch board informatio of a single symbol.
        await this.loadMarkets ();
        symbol = symbol.slice (0, -4);
        const request = {
            'symbol': symbol,
        };
        return this.privateGetBoardSymbol (this.extend (request, params));
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
        const response = this.fetch2 ('register', 'private', 'PUT', {}, undefined, body, {}, {});
        return response['RegistList'];
    }
};
