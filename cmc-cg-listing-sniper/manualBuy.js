"use strict";
const env = require("dotenv");
const result = env.config()
const chalk = require('chalk');
const { buyToken } = require('./snipe');
const inquirer = require('inquirer');

if (result.error) {
    throw result.error
}
const manualBuy = async (token, purchaseAmount) => {
    console.log(chalk.yellow('= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = ='));
    console.log(message.content.text.text);
    console.log(chalk.yellow('= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = ='));
    inquirer.prompt([
        {
            type: 'confirm',
            name: 'manualBuy',
            message: 'Buy token?',
        },
    ])
        .then(answers => {
            if (answers.manualBuy === true) {
                buyToken(token, purchaseAmount);
            }
            if (answers.manualBuy === false) {
                console.log(chalk.yellow(token + " - SKIPPING."));
            }
        }
        );
}

module.exports = {
    manualBuy,
};