import ccxt


print(ccxt.__version__)

kabus = ccxt.kabus({
    'apiKey': '9324ca46e9d645c9afa0e9ad9a8584d4'
})

print(kabus.fetch_ticker('167030018@24'))
