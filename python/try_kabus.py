import ccxt


print(ccxt.__version__)

kabus = ccxt.kabus({
    'apiKey': '0a0514a10f76457cb51350e5ae5894bc'
})

# print(kabus.fetch_ticker('167030018@24', params={'symbol': '167030018@24'}))
print(kabus.publicGetBoardSymbol(params={'symbol': '8897@1'}))
