import {config, blacklist, lang} from './../core';
import saveconfig from 'update-dotenv';
import msgControl from '../handler/msgControl';

/**
 * 通常会用到的一些函式
 * @type {[type]}
 */
export default {
  /**
   * 检查消息是否是命令
   * @param  {Object}  message Message
   * @return {Boolean}
   */
  isCommand (message) {
    return (message.entities
      && message.entities[0].type == 'bot_command') ? true : false;
  },
  /**
   * 检查是否是私聊状态
   * @param  {Object}  message message
   * @return {Boolean}
   */
  isPrivate (message) {
    return (message.chat.type == 'private') ? true : false;
  },
  /**
   * 消息来自管理员吗
   * @param  {[type]}  message [description]
   * @return {Boolean}         [description]
   */
  isAdmin (message) {
    return (message.from.id == config.Admin) ? true : false;
  },
  /**
   * 是本机器人吗
   * @param  {[type]}  message [description]
   * @return {Boolean}         [description]
   */
  isMe (message) {
    let match = message.text.split('@');
    return (match[1] && match[1] != config.BotUserName) ? false : true;
  },
  /**
   * 检查此条消息是否是将机器人新加到群的提示
   * @param  {Object}  message Message
   * @return {Boolean}
   */
  isNewJoin (message) {
    return message.new_chat_member
      && message.new_chat_member.id == config.BotID ? true : false;
  },
  async updateConfig (params) {
    for (let k in params) {
      let v = params[k];
      config[k] = v;
      if (typeof v == 'number') {
        params[k] = v.toString();
      }
    }
    await saveconfig(params);
    return true;
  },
  /**
   * 获取10位的时间戳
   * @return {number} 时间戳
   */
  getTimestamp () {
    return Math.floor(Date.now() / 1000);
  },
  /**
   * 检查文本中是否含有URL
   * @param  {[type]}  text [description]
   * @return {Boolean}      [description]
   */
  hasUrl (text) {
    let preg = /((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g;
    return preg.test(text);
  },
  /**
   * 检查现在是否需要静音
   * @return {Boolean} [description]
   */
  isMute () {
    if (config.AutoMute) {
      let hours = new Date().getHours();
      if (hours > 23 || hours < 7) {
        // 夜间静音
        return true;
      }
    }
    return false;
  },
  /**
   * 传入用户消息，检查此人是否被封锁
   * @param  {[type]}  message  [description]
   * @param  {Boolean}  showTips 回复被封锁消息
   * @return {Boolean}          [description]
   */
  isBlock (message, showTips = false) {
    if (blacklist.has({id: message.from.id})) {
      if (showTips) {
        msgControl.sendMessage(message.chat.id, lang.get('blacklist_ban_tips'));
      }
      return true;
    }
    return false;
  },
  /**
   * 延迟执行
   * @param  {[type]} delay [description]
   * @return {[type]}       [description]
   */
  sleep (delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    })
  }
}
