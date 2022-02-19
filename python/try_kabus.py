import ccxt
import json
import os

with open(f'{os.environ["HOME"]}/.kabuto/credentials.json', 'r') as f:
    credential = json.load(f)

print(ccxt.__version__)

kabus = ccxt.kabus({
    'ipaddr': credential['KABUSAPI_HOST'],
    'password': credential['KABUSAPI_LIVE_PW']
})

response = kabus.fetch_ticker('8897@1')
print(response)
