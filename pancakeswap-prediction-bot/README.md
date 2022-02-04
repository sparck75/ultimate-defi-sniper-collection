# Pancakeswap Prediction Bot

Join our community: https://t.me/drfurrbots

 - With all of my bots you can find pre-compiled binaries in the dist folder. You should be able to run this bot anywhere (even mobile) without worrying about other dependencies.
 - I also removed the bullshit automatic "donation" that the original and other forks have. 

1. rename env.example to .env
2. edit .env
3. automatic betting ftw

```
PRIVATE_KEY=
BET_AMOUNT=.01
#Optional
BSC_RPC=https://bsc-dataseed1.ninicoin.io/
```

________________________________________________________

This bot fetches the overall consensus of the 5min and 1min BNB/USDT charts based on a number of TA signals provided by Trading View. It determines if the consensus is a BUY or SELL prior to each prediction round and places the bet on PancakeSwap or CandleGenie accordingly.

#### Advice:
- Set your bet amount to no higher than 1/10th of your available BNB balance.

## Disclaimers

**Nothing contained in this program, scripts, code or repository should be construed as investment advice.**

~~Every time the bot wins, it donates a small portion of your winnings to the  developer of this bot so that he can have a delicious meal for dinner~~
All investment strategies and investments involve risk of loss.
By using this program you accept all liabilities, and that no claims can be made against the developers or others connected with the program.
Credits to Modagavr for original build. I extended the bot greatly to make it much smarter as opposed to just following/going against the trend of other bettors.
