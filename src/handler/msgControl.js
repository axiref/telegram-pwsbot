import {config, bot, vars, lang, subs, helper, re} from '../core';

/**
 * (主动)消息发送控制器
 * @type {Array}
 */
export default
{
  /**
   * 向用户发送投稿确认信息
   * @param  {Object} message Message
   * @return {[type]}         [description]
   */
  subAsk (message) {
    let yeslabel = message.forward_date ? lang.get('yes_only') : lang.get('yes');
    let inline_keyboard = [[{text: yeslabel, callback_data: vars.SUB_REAL}]];
    let reply_to_message_id = (message.message_id) ? message.message_id : message.media[0].message_id;
    let text = lang.get('sub_confirm_tip');
    if (!message.forward_date) {
      // 如果是转发的讯息，则投稿者无权选择匿名
      inline_keyboard[0].push({ text: lang.get('no'), callback_data: vars.SUB_ANY });
    } else {
      // 投稿者转发别处的消息，不显示否按钮，并且文案也有所不同
      text = lang.get('sub_confirm_tip_fwd');
    }
    inline_keyboard.push([{ text: lang.get('sub_button_cancel'), callback_data: vars.SUB_CANCEL }]);
    bot.sendMessage(message.chat.id, text, {
      reply_to_message_id,
      reply_markup: { inline_keyboard }
    })
  },
  /**
   * 编辑一条信息
   * @param  {[type]} text    [description]
   * @param  {[type]} params  {message_id, chat_id}
   * @return {[type]}         [description]
   */
  editMessage (text, params = {}) {
    let _params = Object.assign({
      parse_mode: 'Markdown',
    }, params)
    return bot.editMessageText(text, _params);
  },
  /**
   * 编辑当前的消息
   * @param  {[type]} text    [description]
   * @param  {[type]} message [description]
   * @param  {Object} params  [description]
   * @return {[type]}         [description]
   */
  editCurrentMessage (text, message, params = {}) {
    let _params = Object.assign({
      chat_id: message.chat.id,
      message_id: message.message_id
    }, params);
    return this.editMessage(text, _params);
  },
  /**
   * 使用现有结构发送消息
   * @param  {[type]} text    [description]
   * @param  {[type]} message [description]
   * @param  {Object} params  [description]
   * @return {[type]}         [description]
   */
  sendCurrentMessage (text, message, params = {}) {
    return this.sendMessage(message.chat.id, text, params);
  },
  /**
   * 发送消息,默认使用markdown
   * @param  {[type]} chatId [description]
   * @param  {[type]} text   [description]
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
   */
  sendMessage (chatId, text, params) {
    let _params = Object.assign({
      parse_mode: 'Markdown',
    }, params)
    return bot.sendMessage(chatId, text, _params);
  },
  /**
   * 将消息转发到审稿群
   * @param  {Object}  reply_to_message Message
   * @param  {String}  type    投稿类型
   * @return {Promise}         成功后返回转发后的Message对象
   * {reply_to_message_id: 审稿群actionMsg应该回复的稿件消息ID，message，稿件}
   */
  async forwardMessage (reply_to_message, type) {
    let condition = subs.getMsgCondition(reply_to_message);
    let message = subs.one(condition);
    let fwdMsg = {}, respMsg = {};
    // 若是mediagroup消息
    if (message.media_group_id) {
      fwdMsg = (await bot.sendMediaGroup(config.Group, message.media))[0];
      // 将审稿群的mediagroupId写到mediaGroup消息的fwdMsgGroupId节点
      respMsg = subs.update(condition, {fwdMsgGroupId: fwdMsg.media_group_id, sub_type: type});
    } else {
      // 附加审稿群的消息ID到稿件
      fwdMsg = await bot.forwardMessage(config.Group, message.chat.id, message.message_id);// 转发至审稿群
      respMsg = subs.update(condition, {fwdMsgId: fwdMsg.message_id, sub_type: type});
    }
    return {reply_to_message_id: fwdMsg.message_id, message: respMsg};
  },
  /**
   * 询问管理员如何处理稿件
   * @param  {Object} {reply_to_message_id: 审稿群actionMsg应该回复的稿件消息ID，message，稿件}
   * @return {[type]}         [description]
   */
  async askAdmin ({reply_to_message_id, message}) {
    let condition = subs.getMsgCondition(message);
    let text = lang.getAdminAction(message);
    let from = message.sub_type == vars.SUB_ANY ? 'anonymous' : 'real';
    let actionMsg = await bot.sendMessage(config.Group, text, {
      reply_to_message_id,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        resize_keyboard: true,
        inline_keyboard: [[{text: lang.get('button_receive'), callback_data: `receive:${from}`}]]
      }
    });
    subs.update(condition, {actionMsgId: actionMsg.message_id});// 更新actionMsgId
  },

  /**
   * 推送频道消息
   * @param  {[type]} message [description]
   * @param  {[type]} params  comment=评论, isMute=是否静音
   * @return {[type]}         [description]
   */
  async sendChannel (message, params) {
    let resp = null;
    let caption = subs.getCaption(message, params);
    let options = subs.getOptions(message, caption, params);
    if (message.media_group_id) {
      message.media[0].caption = caption;
      resp = await bot.sendMediaGroup(config.Channel, message.media);
    } else if (message.audio) {
      resp = await bot.sendAudio(config.Channel, message.audio.file_id, options);
    } else if (message.document) {
      resp = await bot.sendDocument(config.Channel, message.document.file_id, options);
    } else if (message.voice) {
      resp = await bot.sendVoice(config.Channel, message.voice.file_id, options);
    } else if (message.video) {
      resp = await bot.sendVideo(config.Channel, message.video.file_id, options);
    } else if (message.photo) {
      resp = await bot.sendPhoto(config.Channel, message.photo[0].file_id, options);
    } else {
      resp = await bot.sendMessage(config.Channel, caption, options) 
    }
    return resp;
  },
  /**
   * 审核稿件
   * @param  {Object} message             稿件，查询出来的
   * @param  {Object} receive             审稿人对象，一般是message.from
   * @param  {String} comment             附加评论
   * @param  {Boolean} isMute             是否静音推送
   */
  async receiveMessage (message, receive, params = {}) {
    // 若稿件已经发布，则驳回操作
    if (message.receive_date) { 
      return bot.sendMessage(config.Group, lang.get('err_repeat'), {
        reply_to_message_id: message.fwdMsgId
      }) 
    }
    if (helper.isMute()) {params.isMute = true}
    let resp = await this.sendChannel(message, params);
    let condition = subs.getMsgCondition(message);
    // 记录审稿人和时间
    message = subs.update(condition, { receive, receive_date: helper.getTimestamp(), receive_params: params })
    // 获取审稿群通过审核文案
    let text = lang.getAdminActionFinish(message);
    // 编辑审稿群actionMsg
    await this.editMessage(text, {chat_id: config.Group, message_id: message.actionMsgId, disable_web_page_preview: true});
    let reply_to_message_id = subs.getReplytoMessageId(message);
    // 向用户发送稿件过审信息
    await bot.sendMessage(message.chat.id, lang.get('sub_finish_tip'), { reply_to_message_id })
    return resp;
  },
  /**
   * 拒绝投稿
   * @param  {[type]} message [description]
   * @param  {Object} reject  是谁操作的
   * @param  {String} reason  理由
   * @return {[type]}         [description]
   */
  async rejectMessage (message, reject, reason) {
    // 若稿件已经拒绝，则驳回
    if (message.reject_date) { 
      return bot.sendMessage(config.Group, lang.get('err_repeat_reject'), {
        reply_to_message_id: message.fwdMsgId
      }) 
    }
    let condition = subs.getMsgCondition(message);
    // 记录操作人和拒绝理由及时间
    message = subs.update(condition, { reject, reject_date: helper.getTimestamp(), reject_reason: reason })
    let rejectText = lang.get('reject_tips', { reason });
    // 获取审稿群拒绝审核文案
    let text = lang.getAdminActionReject(message, reason);
    // 编辑审稿群actionMsg
    let reply_to_message_id = subs.getReplytoMessageId(message);
    await this.editMessage(text, {chat_id: config.Group, message_id: message.actionMsgId, disable_web_page_preview: true})
    await bot.sendMessage(message.chat.id, rejectText, { reply_to_message_id, parse_mode: 'Markdown' });
    return message;
  },
  /**
   * 回复用户消息，同时用户将进入聊天状态
   * 用户可透过KeyboardButton退出聊天，管理员可透过/endre 结束会话
   * @param  {[type]} message 稿件
   * @param  {String} comment  管理员回复给用户的消息
   * @return {[type]}         [description]
   */
  async replyMessage (message, comment, reMode = true) {
    if (reMode) {
      await re.start(message);// 进入会话模式
    }
    await this.sendCurrentMessage(lang.get('re_comment', { comment }), message);
    return true;
  },
  /**
   * 回复用户信息
   * @param  {[type]} options.msg    [description]
   * @param  {[type]} options.match  [description]
   * @param  {[type]} options.rep    [description]
   * @param  {[type]} options.repMsg [description]
   * @param  {String} command        /re 或者 /echo 
   * re 会进入会话状态， echo 只是发送，不进入会话
   * @return {[type]}                [description]
   */
  async replyMessageWithCommand ({ msg, match, rep, repMsg }, command = '/re') {
    if (helper.isPrivate(msg)) { return false }
    const comment = match[1];
    if (!comment) {throw {message: lang.get('admin_reply_err', { command })}}// 没有输入消息
    let message = subs.getMsgWithReply(repMsg);
    if (!message && !repMsg.forward_from) { return false }// 无从回复
    if (!message) { message = { chat: repMsg.forward_from, from: repMsg.forward_from } }
    let chatMode = command == '/re' ? true : false;
    await this.replyMessage(message, comment, chatMode);
    let respMsg = await rep(lang.get('re_send_success'));
    await helper.sleep(1000);
    this.editCurrentMessage("...", respMsg);
    await helper.sleep(2000);
    bot.deleteMessage(respMsg.chat.id, respMsg.message_id);
  },
  /**
   * 管理员点击采纳稿件(从actionMsg点击按钮)
   * @param  {Object}  query callback data
   * @return {Promise}       [description]
   */
  async receive (query) {
    let fwdMsg = query.message.reply_to_message;// 审稿群的稿件
    let condition = subs.getFwdMsgCondition(fwdMsg);// 得到查询条件
    let message = subs.one(condition);// 得到真实稿件
    this.receiveMessage(message, query.from);
  }
}
