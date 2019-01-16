import { lang, vars, helper, subs } from '../core';
import Db from './Db';

class BlackList extends Db
{
  /**
   * 取消封锁一个用户，透过ID
   * @param  {Int} userId 用户ID
   * @return {String}        成功返回文案，失败抛出异常
   */
  unbanWithUserId (userId) {
    let condition = {id: userId};
    if (this.has(condition)) {
      this.del(condition);
      return lang.get('blacklist_unban_only_id', condition);
    }
    throw {message: lang.get('blacklist_unban_notexists')}
  };
  /**
   * 从管理员的指令消息包含的稿件里解除封锁某个用户
   * @param  {[type]} repMsg 用户用 /unban 命令回复的那个消息
   * @return {String}        成功返回文案，失败抛出异常
   */
  unbanWithMessage (repMsg) {
    let message = subs.getMsgWithReply(repMsg);
    if (!message) {throw { message: lang.get('sub_not_exists') }};
    let condition = {id: message.from.id};
    let userinfo = lang.getUser(message.from);
    // 若用户已经被封锁
    if (blacklist.has(condition)) {
      blacklist.del(condition);
      return lang.get('blacklist_unban', userinfo);
    }
    throw {message: lang.get('blacklist_unban_notexists')}
  };
  /**
   * 透过UserID封锁用户
   * @param  {[type]} userId [description]
   * @return {[type]}        [description]
   */
  banWithUserId (userId) {
    let condition = {id: userId};
    if (this.has(condition)) {
      throw {message: lang.get('blacklist_exists_only_id', condition)}
    }
    this.add(condition);
    return lang.get('blacklist_success_only_id');
  };
  /**
   * 透过用户指令来封锁用户
   * @param  {[type]} repMsg 用户用 /unban 命令回复的那个消息
   * @return {[type]}     [description]
   */
  banWithMessage (repMsg) {
    let message = subs.getMsgWithReply(repMsg);
    if (!message) { throw { message: lang.get('sub_not_exists') }}
    let userinfo = lang.getUser(message.from);
    // 若用户已经被封锁
    if (this.has({id: message.from.id})) {
      throw {message: lang.get('blacklist_exists', userinfo)}
    }
    this.add(message.from);
    return lang.get('blacklist_success', userinfo);
  };

}

const blacklist = new BlackList('blacklist');

export default blacklist;