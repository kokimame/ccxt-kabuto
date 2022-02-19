import ccxt

print(ccxt.__version__)

binance = ccxt.binance()

response = binance.fetch_l2_order_book('ETH/USDT')
print(response)
