const TELEGRAM_BOT = require("node-telegram-bot-api");

const TOKEN = process.env.TOKEN;
const bot = new TELEGRAM_BOT(TOKEN, {polling: true});

module.exports = {bot};

require("./message");
require("./query");
