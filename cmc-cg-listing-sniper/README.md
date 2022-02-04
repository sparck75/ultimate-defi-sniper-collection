
# CoinMarketCap and CoinGecko Listing Sniper Bot

Join our community: https://t.me/drfurrbots

## Requirements
* Telegram Account

## Installation

### Telegram Requirements
 * Join the "Coinmarketcap Fastest Alerts" and/or "CoinGecko Fastest Alerts" telegram channel. The bot is triggered by the "insider info" posts to these channels. The bot will only buy each token one time.
    - https://t.me/CMC_fastest_alerts
    - https://t.me/CG_fastest_alerts

### Configure the sniper bot
 - With all of my bots you can find pre-compiled binaries in the dist folder. You should be able to run this bot anywhere (even mobile) without worrying about other dependencies.
 - For this bot you need to make sure to have all accompanying files, these are for the Telegram API.
 - The binaries already have the Telegram API configured and are ready to go. It's against Telegram's terms of service to share these in plain text, so if you are building from source you will need to generate your own API creds.

- RENAME the "env.example" file to ".env" and edit it.
```
# Your APP ID From my.telegram.org
APP_ID=
# Your APP HASH From my.telegram.org
APP_HASH=
# Your wallet address
RECIPIENT=
# Your wallet's private key
PRIVATE_KEY=
# BSC node web socket address
BSC_NODE_WSS=wss://bsc-ws-node.nariox.org:443
# Gas limit for transaction
GASLIMIT="1000000"
# Gas price for transaction
GASPRICE="5"
# CoinGecko settings
COINGECKO=true
COINGECKO_PURCHASEAMOUNT="0.005"
# CoinMarketCap settings
COINMARKETCAP=true
COINMARKETCAP_PURCHASEAMOUNT="0.01"
# Run bot in whitelist only mode?
WHITELIST_ONLY=false
# Always buy whitelisted tokens?
WHITELIST_ALWAYS=true
WHITELIST_PURCHASEAMOUNT="0.05"
# Comma seperated list of tokens to whitelist
WHITELIST=
```

## Usage
Open the command prompt or terminal (depending on your OS) and change to the directory where you extracted the bot, then run `listingsniper`. 

The first time you run the bot, you will be prompted to login with a telegram account.

- On macOS and linux, you may have to make the bot executable `chmod +x listingsniper`
