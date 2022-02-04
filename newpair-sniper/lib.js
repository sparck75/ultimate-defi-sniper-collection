async function getNonce(e) {
    return await provider.getTransactionCount(e);
}

async function getTokenBalance(e, o, n) {
    const t = new ethers.Contract(
        e,
        [
            {
                name: "balanceOf",
                type: "function",
                inputs: [{ name: "_owner", type: "address" }],
                outputs: [{ name: "balance", type: "uint256" }],
                constant: !0,
                payable: !1,
            },
        ],
        n
    );
    return await t.balanceOf(o);
}

async function getWBNBTokenBalance(e, o, n) {
    const t = new ethers.Contract(
        e,
        [
            {
                name: "balanceOf",
                type: "function",
                inputs: [{ name: "_owner", type: "address" }],
                outputs: [{ name: "balance", type: "uint256" }],
                constant: !0,
                payable: !1,
            },
        ],
        n
    );
    return await t.balanceOf(o);
}

const isLiqudityInRange = function (e, o) {
    o = parseFloat(o);
    const n = parseInt(o).toString(),
        t = ethers.utils.parseUnits(n, "ether");
    return e.value.gte(t);
};

function convertToSeconds(e) {
    var o = e.split(":");
    return 60 * +o[0] * 60 + 60 * +o[1] + +o[2];
}

const monitorRugPull = async function (e) {
    console.log(chalk.red("Monitoring for rug pull in progress ....\n")),
        provider.on("pending", async (n) => {
            const t = await provider.getTransaction(n);
            if (
                null != t &&
                t.data.includes(token) &&
                (t.data.includes("0xbaa2abde") ||
                    t.data.includes("0x02751cec") ||
                    t.data.includes("0xaf2979eb") ||
                    t.data.includes("0xded9382a") ||
                    t.data.includes("0x5b0d5984") ||
                    t.data.includes("0x2195995c"))
            ) {
                console.log(chalk.red("Rug pull detected\n"));
                const n = t.gasLimit.mul(2),
                    s = t.gasPrice.mul(2);
                console.log(chalk.red("Start selling all tokens"));
                const a =
                    await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        e,
                        amountOutMin,
                        [tokenAddress, WBNB],
                        myAddress,
                        Date.now() + 6e5,
                        { gasLimit: n, gasPrice: s }
                    );
                await a.wait(),
                    console.log(
                        chalk.green("Sucessfully sold all the tokens before rug pull !\n")
                    ),
                    console.log("You can check the transaction here:"),
                    console.log(`https://bscscan.com/address/${myAddress}`),
                    console.log("\n"),
                    process.exit(0);
            }
        });
};

module.exports = {
    monitorRugPull,
    convertToSeconds,
    isLiqudityInRange,
    getWBNBTokenBalance,
    getTokenBalance,
    getNonce
}