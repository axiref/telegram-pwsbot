import {config, bot, helper, lang, subs, blacklist, re} from '../core';
import msgControl from './msgControl';

/**
 * 接收到来自Telegram的普通私聊消息
 * @type {[type]}
 */
export default
{
  process (message) {
    subs.optimize();// 利用消息事件主动触发优化函式
    this.message = message;
    if (helper.isCommand(message)) {
      return false;// 此处不处理command
    } else if (helper.isNewJoin(message)) {
      let chatId = message.chat.id;
      // 是否是本机器人新进群的提示信息
      if (config.Group && config.Group != chatId) {
        return msgControl.sendMessage(chatId, lang.get('reject_intro_tips')).then(() => {
           bot.leaveChat(chatId);
        })
      }
      bot.sendMessage(message.chat.id, lang.get('intro_new_group', {command: '/setgroup'}));
    } else if (helper.isPrivate(message)) {
      // 是私信渠道的投稿
      if (helper.isBlock(message, true)) { return false }
      // 如果用户发送了 "结束对话"
      if (message.text && message.text == lang.get('re_end')) {
        return re.end(message);
      } else if (re.has(message.from.id)) {
        // 进入会话模式，将用户之所有讯息转发到审稿群
        bot.forwardMessage(config.Group, message.chat.id, message.message_id);// 转发至审稿群
      } else {
        subs.process(message, (message) => { msgControl.subAsk(message) });
      }
    }
  }
}
