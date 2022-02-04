"use strict";
const { buyToken } = require('./snipe');
const { manualBuy } = require('./manualBuy');
const ora = require('ora');
const chalk = require('chalk');
let spinner2

const processToken = async (readonly, whitelistonly, manualonly, token, purchaseAmount, whitelisted) => {
    if (readonly === "true") {
        spinner2 = ora().start();
        spinner2.info(chalk.yellow(token + " - NOT BUYING. READ ONLY MODE."));
        console.log("")
    }
    if (readonly === "false" && whitelistonly === "true" && whitelisted.includes(token)) {
        spinner2 = ora().start();
        spinner2.info(chalk.green(token + " - WHITELISTED."));
        console.log("")
        await buyToken(token, purchaseAmount);
    }
    if (readonly === "false" && whitelistonly === "true" && !whitelisted.includes(token)) {
        spinner2 = ora().start();
        spinner2.info(chalk.yellow(token + " - NOT WHITELISTED. SKIPPING."));
        console.log("")
    }
    if (readonly === "false" && whitelistonly === "false" && manualonly === "true") {
        await manualBuy(token, purchaseAmount);
    }
    if (readonly === "false" && whitelistonly === "false" && manualonly === "false") {
        spinner2 = ora().start();
        spinner2.info(chalk.green(token + " - BUYING."));
        console.log("")
        await buyToken(token, purchaseAmount);
    }
}

module.exports = {
    processToken,
};