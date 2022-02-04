"use strict";
const ethers = require("ethers");
const env = require("dotenv");
const result = env.config()

if (result.error) {
    throw result.error
}

let provider;
let wallet;
let account;
let router;

const approveToken = async (token) => {
    console.log(`Approving ${token}`)
    provider = new ethers.providers.WebSocketProvider(process.env.BSC_NODE_WSS);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    account = wallet.connect(provider);
    router = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const sellContract = new ethers.Contract(
        token,
        [
            "function approve(address _spender, uint256 _value) public returns (bool success)",
            "function name() external pure returns (string memory)",
        ],
        account
    );
    const tokenName = await sellContract.name();
    const tx = await sellContract.approve(router, ethers.constants.MaxUint256);
    const receipt = await tx.wait();
    console.log("Approved " + tokenName + "!");
    console.log("  Transaction receipt: https://www.bscscan.com/tx/" + receipt.transactionHash);
    console.log("");
};

module.exports = {
    approveToken,
};
