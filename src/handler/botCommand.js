import {config, bot, helper, lang, subs, blacklist, re} from '../core';
import onText from './commandHandler';
import msgControl from './msgControl';

/**
 * 解除对用户的封锁
 * @param  {[type]} /\/unban (.+)|\/unban/ [description]
 * @param  {[type]} (msg,    match)        [description]
 * @return {[type]}          [description]
 */
onText(/\/unban (.+)|\/unban/, ({ rep, msg, match, repMsg }) => {
  if (helper.isPrivate(msg)) { return console.warn('不能运行在Private私聊状态下') }
  const userId = match[1];
  if (!repMsg && !userId) { return rep(lang.get('blacklist_unban_err_noparams')) }
  return rep (userId ? blacklist.unbanWithUserId(userId) : blacklist.unbanWithMessage(repMsg));
})

/**
 * 查看更多管理员命令
 * @param  {[type]} /\/pwshelp/ [description]
 * @param  {[type]} ({         rep,          msg } [description]
 * @return {[type]}             [description]
 */
onText(/\/pwshelp/, ({ rep, msg }) => {
  if (helper.isPrivate(msg)) { return console.warn('不能运行在Private私聊状态下') }
  return rep(lang.get('pwshelp'));
})

/**
 * 管理员在审稿群解除用户的会话状态
 * @param  {[type]} /\/unre (.+)|\/unre/  [description]
 * @param  {[type]} ({     rep,          msg,          match, repMsg } [description]
 * @return {[type]}         [description]
 */
onText(/\/unre (.+)|\/unre/, ({ rep, msg, match, repMsg }) => {
  if (helper.isPrivate(msg)) { return console.warn('不能运行在Private私聊状态下') }
  let userId = match[1];
  if (!repMsg && !userId) { return rep(lang.get('unre_err_noparams')) }
  let message = subs.getMsgWithReply(repMsg);

  if (!userId) {
    if (!message) {
      if (!repMsg.forward_from) {
        throw {message: lang.get('unre_err_unknown')};// 既没有稿件，回复的也不是转发而来的信息，则报错
      } else {
        message = { chat: repMsg.forward_from, from: repMsg.forward_from }
      }
    }
    userId = message.from.id;
  }
  if (!re.has(userId)) {
    throw {message: lang.get('unre_err_not_exists')};// 用户不存在于会话列表
  }
  message ? re.end(message): re.endWithId(userId);
  rep(lang.get('unre_success'))
})

/**
 * 封锁一个用户
 * @param  {[type]} /\/ban  (.+)|\/ban/   [description]
 * @param  {[type]} ({msg, match,        repMsg,       rep} [description]
 * @return {[type]}         [description]
 */
onText(/\/ban (.+)|\/ban/, ({msg, match, repMsg, rep}) => {
  if (helper.isPrivate(msg)) { return false; }
  const userId = match[1];
  if (!repMsg && !userId) { return rep(lang.get('blacklist_ban_err_noparams')) }
  return rep(userId ? blacklist.banWithUserId(userId) : blacklist.banWithMessage(repMsg))
})

/**
 * 在审稿群拒绝一个稿件
 * @param  {[type]} /\/no (.+)|\/no/    [description]
 * @param  {[type]} async ({           msg,          match, rep, repMsg, chatId } [description]
 * @return {[type]}       [description]
 */
onText(/\/no (.+)|\/no/, async ({ msg, match, rep, repMsg, chatId }) => {
  if (helper.isPrivate(msg)) { return false }
  const reason = match[1];
  if (!reason) {throw {message: lang.get('err_reject_reason')}}// 没有理由则驳回请求
  let message = subs.getMsgWithReply(repMsg);
  if (!message) { throw {message: lang.get('err_no_sub')} }// 没找到稿件
  // 若稿件已经发布，则驳回操作
  if (message.receive_date) { 
    throw {message: lang.get('err_repeat')}
  }
  await msgControl.rejectMessage(message, msg.from, reason);
  rep(lang.get('admin_reject_finish', { reason }));
})

/**
 * 在审稿群对用户稿件进行回复
 * !只能回复文本
 * @param  {[type]} /\/re (.+)|\/re/    [description]
 * @param  {[type]} ({   msg,          match,        rep, repMsg } [description]
 * @return {[type]}       [description]
 */
onText(/\/re (.+)|\/re/, async ({ msg, match, rep, repMsg }) => {
  if (helper.isPrivate(msg)) { return false }
  const comment = match[1];
  if (!comment) {throw {message: lang.get('admin_reply_err')}}// 没有输入消息
  let message = subs.getMsgWithReply(repMsg);
  if (!message && !repMsg.forward_from) {
    throw {message: lang.get('re_err_unknown')};// 既没有稿件，回复的也不是转发而来的信息，则报错
  }
  if (!message) { message = { chat: repMsg.forward_from, from: repMsg.forward_from } }
  await msgControl.replyMessage(message, comment);
  let respMsg = await rep(lang.get('re_send_success'));
  setTimeout(() => {
    msgControl.editCurrentMessage("...", respMsg);
  }, 1000)
  setTimeout(() => {
    // 删除消息
    bot.deleteMessage(respMsg.chat.id, respMsg.message_id);
  }, 2000)
})

/**
 * 使用评论并采纳稿件
 * @param  {[type]} /\/ok (.+)|\/ok/    [description]
 * @param  {[type]} ({msg, match}         [description]
 * @return {[type]}       [description]
 */
onText(/\/ok (.+)|\/ok/, ({ msg, match, rep, repMsg }) => {
  if (helper.isPrivate(msg)) { return false; }
  const comment = match[1];
  let message = subs.getMsgWithReply(repMsg);// 找到稿件
  if (!message) { throw {message: lang.get('err_no_sub')} }// 稿件不存在
  msgControl.receiveMessage(message, msg.from, { comment });// 采纳稿件
})

/**
 * 设置审稿群
 * @param  {String} /\/setgroup$|\/setgroup@/ 
 */
onText(/\/setgroup$|\/setgroup@/, ({ msg, chatId, rep }) => {
  if (helper.isPrivate(msg)) { return false; }
  if (!helper.isAdmin(msg)) {
    return console.warn('设置审稿群，但操作者不是配置文件中配置的Admin！');
  } else if (!helper.isMe(msg)) {
    return console.log('设置审稿群：不是本机器人！');
  }
  // 设置审稿群
  helper.updateConfig({ Group: msg.chat.id });
  // 回复用户
  rep(lang.get('command_setgroup_tip'))
})

/**
 * start命令
 * @param  {String} /\/start/ 
 */
onText(/\/start/, ({ msg, rep }) => {
  if (!helper.isPrivate(msg)) { return false }// 仅私聊可用
  if (helper.isBlock(msg)) { return false }// 被封锁者不可用
  if (re.has(msg.from.id)) {
    re.end(msg);// 若已经是编辑模式，则退出
  }
  rep (lang.get('start'));
})

/**
 * help命令
 * @param  {String} /\/help/ 
 */
onText(/\/version/, ({ rep }) => {
  rep(lang.get('help', {ver: '1.0', link: 'https://github.com/axiref/telegram-pwsbot'}));
})
