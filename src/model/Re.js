import { lang, vars, helper, subs } from '../core';
import msgControl from '../handler/msgControl';
import Db from './Db';

class Re extends Db
{
  /**
   * 结束对话模式
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  end (message) {
    this.del({ id: message.from.id });
    msgControl.sendCurrentMessage(lang.get('re_end_tips'), message, {
      reply_markup: { remove_keyboard: true }
    });
  };
  /**
   * 透过userID结束会话
   * @param  {[type]} userId [description]
   * @return {[type]}        [description]
   */
  endWithId (userId) {
    let id = parseInt(userId)
    this.end({
      from: { id },
      chat: { id },
    })
  };
  has (userId) {
    let uid = parseInt(userId)
    return super.has({ id: uid });
  };
  /**
   * 进入对话模式
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  async start (message) {
    let condition = { id: message.from.id };
    if (!this.has(message.from.id)) {
      this.add(condition);
      // 给用户发送含有KeyboardButton的消息，告知已进入会话模式
      await msgControl.sendCurrentMessage(lang.get('re_start', {re_end: lang.get('re_end')}), message, {
        resize_keyboard: true,
        one_time_keyboard: true,
        reply_markup: {keyboard: [[{text: lang.get('re_end')}]] }
      })
      return true;
    }
    return true;
  };
}

const re = new Re('re');

export default re;