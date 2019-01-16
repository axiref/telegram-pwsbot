import { bot, vars, lang } from '../core';
import msgControl from './msgControl';

/**
 * onText命令闭包函式
 * @param  {Object}   msg 当前的Msg对象
 * @param  {Function} cb  回调函数，rep传回一个rep函数，输入文本即可回复当前用户文本;chatId;repMsg回复的信息(若有)
 * @return {[type]}       [description]
 */
export default function (preg, cb) 
{
  bot.onText(preg, async (msg, match) => {
    try {
      const chatId = msg.chat.id;
      const repMsg = msg.reply_to_message;
      await cb({
        /**
         * 此函式可直接回复用户指令
         * @param  {[type]} text [description]
         * @return {[type]}      [description]
         */
        rep: text => {
          return msgControl.sendCurrentMessage(text, msg, { 
            reply_to_message_id: msg.message_id 
          })
        },
        chatId,// 会话ID
        repMsg,// 被回复的信息
        match,// 匹配到的消息
        msg// 用户指令消息本身
      })
    } catch (err) {
      let errText = err.message;
      if (msg) {
        let params = msg ? {reply_to_message_id: msg.message_id} : {}
        if (errText == vars.BOT_BLOCK) {
          errText = lang.get('re_send_err');
        }
        msgControl.sendCurrentMessage(errText, msg, params);
      }
      throw {err, msg};
    }
  })
}