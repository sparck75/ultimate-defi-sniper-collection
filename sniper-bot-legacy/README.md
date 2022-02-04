# Welcome to Dr. Furr's Sniper Bot. Join the community: https://t.me/drfurrbots.

With all of my bots you can find pre-compiled binaries in the dist folder. You should be able to run this bot anywhere (even mobile) without worrying about other dependencies.

# All the variables possible values are explained below, PLEASE SET THE CORRECT VALUES OR ELSE THE BOT WON'T WORK.

# GENERAL SETTINGS:

`privateKey`: The private key is self explanatory. No one will **ever** ask for it. Don't **share** it.

`Mode`: Mode is the function the bot will execute. There are only 3 possible values:
1 is for Snipe Dx Sale presale.
2 is for Snipe Listings from presale.
3 is for Front Run transaction module.

# SNIPE DXSALE PRESALE SETTINGS (MODE 1):

`countDown` = Countdown on which Dx Sale presale function will start. **HH:MM:SS**

`DxSalePresaleAddress` = The presale address from Dx Sale, the one above the contract.

`BNB_To_Use` = Amount of BNB that you want to enter the presale with.

`SetGwei` = Set your own gwei.

`SetGas` = Set your own gas.

`autoClaim` = Auto claim, possible values are true (yes) or false (no).

# SNIPE LISTING AND FRONT RUN TRANSACTION MODULE SETTINGS (MODE 2 & 3):

`TokenContract` = Contract of token you want to snipe.

`tokenDecimals` = Token decimals from token contract on bscscan.

`WBNB_To_Use` = Amount of WBNB to use for each transaction.

`Gwei` = Fees price used for snipe for listings from dxsale, approve, instant buy and selling.

`Gas` = Fees price used for snipe for listings from dxsale, approve, instant buy and selling.

`ApproveToken` = Approve token for selling on bot start? **(true/false)**

`approveBeforeOrAfter` = If you want to approve the token before the snipe please put 1 , if you want to do it after please put 2.

`buyOnlyMode` = Set to true if you want to set buy only token mode active. For buyOnlyMode you can either set up **detectDxSale** or **detectFairLaunch** it will do the same function. **(snipeOnlyMode must be false)**.

`snipeOnlyMode` = Set to true if you want to set snipe only mode active. **(buyOnlyMode must be false)**.

`detectDxSale` = Set to true if you want to detect listings on presale dxSale when Sniping. **(detectFairLaunch must be false)**.

`detectFairLaunch` = Set to true if you want to detect ONLY fair launch when Sniping. **(detectDxSale must be false)**.

`MultiplyGas` = it will multiply the gas fees from the liquidity transaction to get in first block. Only usable on **snipeOnlyMode** and **detectFairLaunch** mode.

`instantSell` = Sell instant after buy/snipe? **(true/false)**.

`sellDelay` = Set a delay in seconds for the bot to instant sell after buy confirmation, if you want instant put 0.

`AntiBot` = Snipe antibot token (meaning you put less WBNB to buy with and do more transactions fast to gather more token).

`TransactionsToDo` = If you have AntiBot set to **true** then it will automatically do X number of buy transactions.

`antiRug` = If you have **antiRug** set true and **instantSell** is false then after snipe the bot will wait for RugPull. If it detects one it will immediately sell all tokens before RugPull.

`skipBlock` = It will skip block depending of the **NUMBER** you’ve set in the settings abounding contract tax set by devs, works only on **snipeOnlyMode**.

`PriceCheck` = If you have PriceCheck set true then it will automatically check if the liquidity added is equal or higher than liquidityBNB. **(detectFairLaunch must be true)**.

`liquidityBNB` = Please set less than the expected liquidity for example if you expect to have 100 bnb liquidity use 50 bnb, also use only int numbers with no decimals **(ex: 1, 2, 3, 100)**.

`TransactionsToFrontRun` = Refers to the amount of buy in BNB for the transaction you want to front run. **(Mode must be 3)**.

# In order to use this bot you need to follow these steps:

1. Setup the .env file with the values (PLEASE READ THE DESCRIPTION).

2. Open terminal (or command prompt for Windows)

3. With the terminal open, cd to the directory with the bot, run the command: "./sniper-bot" for linux or "sniper-bot.exe" for windows.

5. To close it you have to kill the terminal, CTRL + C in most of cases depending of your OS. Enjoy.

