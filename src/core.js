import TeleBot from 'node-telegram-bot-api';
import helper from './utils/helper';
import Lang from './utils/Lang';
import blacklist from './model/BlackList';
import Message from './model/Message';
import re from './model/Re';
const subs = new Message('subs');// 稿件
let config = require('dotenv').config().parsed;

if (config.AutoMute) {
  process.env.TZ = config.AutoMute; //切换时区
}

if (!config) {
  throw new Error("不存在 .env 配置，请确保将项目目录下具有 .env 配置文件！(配置文件模板：env.example)");
} else if (!config.Token) {
  throw new Error(".env 配置文件中不存在Token，请确保正确填写！")
} else if (!config.Admin) {
  throw new Error(".env 配置文件中不存在Admin，请确保正确填写！")
} else if (!config.Channel) {
  throw new Error(".env 配置文件中不存在Channel，请确保正确填写！")
}

const bot = new TeleBot(config.Token, {polling: true});

// 保存机器人ID和UserName
bot.getMe().then(info => { helper.updateConfig({BotID: info.id, BotUserName: info.username }) })

/**
 * callback query data
 * @type {Object}
 */
const vars = {
    REC_ANY: 'receive:anonymous',
    REC_REAL: 'receive:real',
    SUB_ANY: 'submission_type:anonymous',
    SUB_REAL: 'submission_type:real',
    SUB_CANCEL: 'cancel:submission',
    BOT_NOAUTH_KICK: 'ETELEGRAM: 403 Forbidden: bot was kicked from the channel chat',
    BOT_NOAUTH: 'ETELEGRAM: 403 Forbidden: bot is not a member of the channel chat',
    BOT_BLOCK: 'ETELEGRAM: 403 Forbidden: bot was blocked by the user',
}

// 语言工具
const lang = new Lang(config.Lang, vars);

export {config, subs, bot, vars, helper, lang, blacklist, re};
