import { lang, vars, helper, re } from '../core';
import Db from './Db';
class Message extends Db
{
  header = 0;
  /**
   * 存储Message
   * 当处理完毕时，会调用回调函式传回消息
   * @param  {Object} message Message
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  process (message, callback) {
    // 针对MediaGroup
    if (message.media_group_id) {
      let groupMsg = this.processMediaMessage(message);
      clearTimeout(this.handler);
      this.handler = setTimeout(() => callback(groupMsg), 500);
    } else {
      this.push(message);
      callback(message);
    }
  };
  /**
   * 获取回复的MessageID
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getReplytoMessageId (message) {
    return message.media_group_id ? message.media[0].message_id : message.message_id;
  };
  /**
   * 获取Caption文本
   * @param  {Object} message 稿件
   * @param  {String} comment 评论
   * @return {String}         返回Caption文本，同样可以使用在SendTextMessage
   */
  getCaption (message, params) {
    let comment = params ? params.comment : '';
    let caption = message.caption ? message.caption + "\n" : '';
    // 添加评语
    if (comment) {caption += lang.get('comment_label', { comment }) + "\n" }
    // 若是实名投稿，则附加版权信息
    if (message.sub_type == vars.SUB_REAL) { caption += "\n" + lang.getViaInfo(message) }
    if (message.text) {
      caption = message.text + `\n\n${caption}`;
    }
    return caption;
  };
  /**
   * 获取sendChannel的Option额外参数
   * @param  {[type]} message         [description]
   * @param  {[type]} caption         [description]
   * @param  {[type]} options.comment [description]
   * @param  {[type]} options.isMute  [description]
   * @return {[type]}                 [description]
   */
  getOptions (message, caption, params) {
    let comment = params ? params.comment : '';
    let isMute = params ? params.isMute : false;
    // 支援markdown和默认关闭链接预览
    let options = {parse_mode: 'Markdown', disable_web_page_preview: true, caption}
    // 若文本或comment含有URL，则开启链接预览
    if (helper.hasUrl(message.text) || helper.hasUrl(comment)) { options.disable_web_page_preview = false }
    if (isMute) {options.disable_notification = true}
    return options;
  };
  /**
   * 排除一些key，得到一个新对象
   * @param  {[type]} obj  [description]
   * @param  {[type]} keys [description]
   * @return {[type]}      [description]
   */
  withoutKeys (obj, keys) {
    let nobj = Object.assign({}, obj);
    for (let key of keys) {
      delete nobj[key];
    }
    return nobj
  };
  /**
   * 合并mediaGroup消息为新的格式
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  processMediaMessage (message) {
    let groupMsg = this.one({media_group_id: message.media_group_id});
    if (!groupMsg) {
      // 排除这些键
      groupMsg = this.withoutKeys(message, ['caption', 'photo', 'video', 'message_id']);
      groupMsg.media = [];
    } else {
      // 若已经存在此项，则返回
      let ids = Object.keys(groupMsg.media).map(f=>groupMsg.media[f].message_id);
      if (ids.includes(message.message_id)) { return groupMsg }
    }
    let mediaRow = {};
    if (message.photo) {
      // 选择最清晰的那张图
      mediaRow = { message_id: message.message_id, type: 'photo', media: message.photo[message.photo.length - 1].file_id }
    } else if (message.video) {
      mediaRow = { message_id: message.message_id, type: 'video', media: message.video.file_id }
    }
    if (message.caption) { 
      mediaRow.caption = message.caption 
    }
    mediaRow.parse_mode = 'Markdown';
    groupMsg.media.push(mediaRow);
    // 第一个媒体的描述将作为稿件描述
    if (groupMsg.media[0].caption) {
      groupMsg.caption = groupMsg.media[0].caption;
    }
    this.pushMediaGroup(groupMsg);
    return groupMsg;
  };
  /**
   * 从审稿群的稿件消息得到原稿件对象的查询条件
   * @param  {[type]} fwdMsg 审稿群的稿件
   * @return {[type]}         [description]
   */
  getFwdMsgCondition (fwdMsg) {
    if (fwdMsg.media_group_id) {
      return {fwdMsgGroupId: fwdMsg.media_group_id};
    } else if (fwdMsg.message_id) {
      return {fwdMsgId: fwdMsg.message_id}
    } else {
      throw new Error('getMsgFromFwd: 很抱歉，message消息格式不正确！');
    }
  };
  /**
   * 从稿件中得到原始稿件的查询条件
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getMsgCondition (message) {
    if (message.media_group_id) {
      return {media_group_id: message.media_group_id};
    } else if (message.message_id) {
      return {message_id: message.message_id}
    } else {
      throw new Error('getMsgFromFwd: 很抱歉，message消息格式不正确！');
    }
  };
  /**
   * 透过用户回复的命令来获取稿件
   * @param  {[type]} fwdMsg 审稿群中的信息
   * @return {[type]}         [description]
   */
  getMsgWithReply (fwdMsg) {
    if (!fwdMsg) {return false}
    let media_group_id = fwdMsg.media_group_id;
    let message_id = fwdMsg.message_id;
    let message = null;
    if (media_group_id) {
      message = this.one({ fwdMsgGroupId: media_group_id });
    } else {
      message = this.one({fwdMsgId: message_id}) || this.one({actionMsgId: message_id})
    }
    return message;
  };
  /**
   * 定时优化掉过期的数据
   * @return {[type]} [description]
   */
  optimize () {
    // 计算出10天前的时间戳
    let tenday = helper.getTimestamp() - (60*60*24*10)
    let msgs = this.db.get(this.table).filter(e => {
      return e.date < tenday
    }).value();
    for (let e of msgs) {
      this.del(e);
    }
  };
  /**
   * 保存一个MediaGroup
   * @param  {[type]} groupMsg
   * @return {[type]}         [description]
   */
  pushMediaGroup (groupMsg) {
    let condition = {media_group_id: groupMsg.media_group_id};
    if (!this.has(condition)) { this.add(groupMsg) } else { this.update(condition, groupMsg) }
  };
  /**
   * 保存一个Message
   * @param {[type]} message [description]
   */
  push (message) {
    if (!this.has({message_id: message.message_id})) {
      this.add(message);
    }
  };
}

export default Message;
