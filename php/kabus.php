<?php

namespace ccxt;

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

use Exception; // a common import
use \ccxt\ExchangeError;

class kabus extends Exchange {

    public function describe() {
        return $this->deep_extend(parent::describe (), array(
            'id' => 'kabus',
            'name' => 'Kabus',
            'countries' => array( 'JP' ),
            'version' => 'v1',
            'rateLimit' => 1000,
            'timeframes' => array(
                '1m' => '1m',
                '3m' => '3m',
                '5m' => '5m',
                '15m' => '15m',
                '30m' => '30m',
                '1h' => '1h',
                '2h' => '2h',
                '4h' => '4h',
                '6h' => '6h',
                '8h' => '8h',
                '12h' => '12h',
                '1d' => '1d',
                '3d' => '3d',
                '1w' => '1w',
                '1M' => '1M',
            ),
            'urls' => array(
                'logo' => 'https://pbs.twimg.com/profile_images/1476235905375813633/-jRNbwhv_400x400.jpg',
                'api' => 'http://{ipaddr}/live/kabusapi',
                'www' => 'https://twitter.com/KabutoTheBot',
                'doc' => 'https://twitter.com/KabutoTheBot',
            ),
            'has' => array(
                'CORS' => null,
                'spot' => true,
                'margin' => null,
                'swap' => null,
                'future' => null,
                'option' => null,
                'fetchOrderBook' => true,
                'fetchTicker' => true,
            ),
            'precision' => array(
                'amount' => null,
                'price' => null,
            ),
            'api' => array(
                'public' => array(
                    'get' => array(
                        'board/{symbol}',
                        '',
                    ),
                    'post' => array(
                        'token',
                    ),
                ),
            ),
            'requiredCredentials' => array(
                'ipaddr' => true,
                'password' => false,
                'apiKey' => false,
                'secret' => false,
                'uid' => false,
                'login' => false,
                'twofa' => false, // 2-factor authentication (one-time password key)
                'privateKey' => false, // a "0x"-prefixed hexstring private key for a wallet
                'walletAddress' => false, // the wallet address "0x"-prefixed hexstring
                'token' => false, // reserved for HTTP auth in some cases
            ),
        ));
    }

    public function fetch_markets($params = array ()) {
        // Returns a list of stock code and its basic properties for trading
        // No API access for now
        $markets = array(
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
        );
        $result = array();
        for ($i = 0; $i < count($markets); $i++) {
            $result[] = array(
                'id' => $i,
                'symbol' => $markets[$i] . '/JPY',
                'base' => 'JPY',
                'quote' => 'JPY',
                'maker' => 0.001,
                'taker' => 0.001,
                'active' => true,
                'min_unit' => 100,
                // value limits when placing orders on this market
                'limits' => array(
                    'amount' => array(
                        // order amount should be > min
                        'min' => 100,
                        // order amount should be < max
                        'max' => 100000000,
                    ),
                    'price' => array(
                        'min' => 100,
                        'max' => 100000000,
                    ),
                    // order cost = price * amount
                    'cost' => array(
                        'min' => 0,
                        'max' => 100000000,
                    ),
                ),
            );
        }
        return $result;
    }

    public function fetch_trades($symbol, $since = null, $limit = null, $params = array ()) {
        $this->load_markets();
        return array();
    }

    public function fetch_ticker($symbol, $params = array ()) {
        $this->load_markets();
        $request = array(
            'symbol' => $symbol,
        );
        return $this->publicGetBoardSymbol (array_merge($request, $params));
    }

    public function fetch_order_book($symbol, $limit = null, $params = array ()) {
        $ticker = $this->fetch_ticker($symbol, $params);
        $keys = is_array($ticker) ? array_keys($ticker) : array();
        $buys = array();
        $sells = array();
        for ($i = 0; $i < count($keys); $i++) {
            $key = $keys[$i];
            if (mb_strpos($key, 'Buy') === 0) {
                $buys[] = [ $ticker[$key]['Price'], $ticker[$key]['Qty'] ];
            }
            if (mb_strpos($key, 'Sell') === 0) {
                $sells[] = [ $ticker[$key]['Price'], $ticker[$key]['Qty'] ];
            }
        }
        $orderbook = array( 'bids' => $buys, 'asks' => $sells );
        return $this->parse_order_book($orderbook, $symbol);
    }

    public function fetch_token() {
        $url = $this->implode_params($this->urls['api'], array( 'ipaddr' => $this->ipaddr )) . '/token';
        $headers = array(
            'Content-Type' => 'application/json',
        );
        // JSON.parse() is needed to load json module in transpiled Python script
        $body = json_encode (array( 'APIPassword' => $this->password ));
        $response = $this->fetch($url, 'POST', $headers, $body);
        if ($response['ResultCode'] === '0') {
            return $response['Token'];
        } else {
            // Temporary placeholder for exception when it fails to get a new token
            throw new ExchangeError();
        }
    }

    public function sign($path, $api = 'public', $method = 'GET', $params = array (), $headers = null, $body = null) {
        $this->check_required_credentials();
        if (!$this->apiKey) {
            $this->apiKey = $this->fetch_token();
        }
        $request = '/' . $this->implode_params($path, $params);
        $url = $this->implode_params($this->urls['api'], array( 'ipaddr' => $this->ipaddr )) . $request;
        $headers = array(
            'X-API-KEY' => $this->apiKey,
            'Content-Type' => 'application/json',
        );
        return array( 'url' => $url, 'method' => $method, 'body' => $body, 'headers' => $headers );
    }
}
