## Welcome to Dr. Furr's Sniper Bot. Join the community: https://t.me/drfurrbots.

### All the variables possible values are explained below, PLEASE SET THE CORRECT VALUES OR ELSE THE BOT WON'T WORK. 

ALPHA. NOT FULLY TESTED. It has memory and network leaks that I will fix it.

This bot listens for new pairs on pancakeswap, runs a honeypot test, and snipes them.

With all of my bots you can find pre-compiled binaries in the dist folder. You should be able to run this bot anywhere (even mobile) without worrying about other dependencies.

### GENERAL SETTINGS:

`PRIVATE_KEY`: The private key is self explanatory. No one will **ever** ask for it. Don't **share** it.

`TOKEN` = Contract of token you want to snipe.

`TOKEN_DECIMALS` = Token decimals from token contract on bscscan.

`PURCHASE_AMOUNT` = Amount of WBNB to use for each transaction.

`GAS_PRICE` = Fees price used for snipe for listings from dxsale, approve, instant buy and selling.

`GAS_LIMIT` = Fees price used for snipe for listings from dxsale, approve, instant buy and selling.

`MULTIPLY_GAS` = it will multiply the gas fees from the liquidity transaction to get in first block. 

`INSTANT_SELL` = Sell instant after buy/snipe? **(true/false)**.

`SELL_DELAY` = Set a delay in seconds for the bot to instant sell after buy confirmation, if you want instant put 0.

`ANTI_BOT` = Snipe antibot token (meaning you put less WBNB to buy with and do more transactions fast to gather more token).

`TRANSACTIONS_NUM` = If you have AntiBot set to **true** then it will automatically do X number of buy transactions.

`ANTI_RUG` = If you have **ANTI_RUG** set true and **INSTANT_SELL** is false then after snipe the bot will wait for RugPull. If it detects one it will immediately sell all tokens before RugPull.

`PRICE_CHECK` = If you have PRICE_CHECK set true then it will automatically check if the liquidity added is equal or higher than LIQUIDITY_BNB. 

`LIQUIDITY_BNB` = Please set less than the expected liquidity for example if you expect to have 100 bnb liquidity use 50 bnb, also use only int numbers with no decimals **(ex: 1, 2, 3, 100)**.

# In order to use this bot you need to follow these steps:

1. Setup the .env file with the values (PLEASE READ THE DESCRIPTION).

2. Open terminal (or command prompt for Windows)

3. With the terminal open, cd to the directory with the bot, run the command: "./sniper-bot" for linux or "sniper-bot.exe" for windows.

5. To close it you have to kill the terminal, CTRL + C in most of cases depending of your OS. Enjoy.

