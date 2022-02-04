const validateInput = (text) => {
    if (!text.includes('Insider')) {
        return false;
    }
    return true
    // try {
    //     const liquidity = text.match(/[0-9]+\.[0-9]*/);
    //     const liqlimit = 125
    //     console.log("Liquidity: " + liquidity)
    //     if (parseFloat(parseFloat(liquidity).toFixed(2)) < parseFloat(parseFloat(liqlimit).toFixed(2))) {
    //         return true;
    //     }
    //     return false;
    // } catch {
    //     return false;
    // }
};

const parseMessage = (text) => {

    const validate = validateInput(text.content.text.text);

    if (!validate) {
        return null;
    }

    if (text.reply_markup) {
        if (text.reply_markup._ === "replyMarkupInlineKeyboard") {
            array = text.reply_markup.rows
            array.forEach((row) => {
                //console.log(row[0])

                if (row[0].text.toUpperCase() === "POOCOIN") {
                    input = row[0].type.url
                    //console.log(input)

                }
            });
        }


    } else {
        input = text.content.text.text
    }
    const token = input.match(/0x[a-fA-F0-9]{40}/);

    if (!token) {
        return null;
    }

    return token[0];

};

module.exports = {
    parseMessage,
};
