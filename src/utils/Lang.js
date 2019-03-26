/**
 * 用于翻译文案的工具
 */
class Lang {

  langName = null;
  lang = null;

  constructor (langName, vars) {
    this.langName = langName;
    this.vars = vars;
  };
  /**
   * 获取语言包JSON
   * @return {[type]} [description]
   */
  get language () {
    if (!this.lang) {
      this.lang = require(`../lang/${this.langName}.json`);
    }
    return this.lang;
  };
  /**
   * 得到翻译内容
   * @param  {String} key     键名，对于Langjson
   * @param  {Object} context 包含变数的对象
   * @return {[type]}         [description]
   */
  get (key, context) {
    let text = this.language[key];
    if (!text) {
      throw new Error(`不存在的Key，语言：${this.langName}，键：${key}，请检查翻译文件！`);
    }
    return text.replace(/{{(.*?)}}/g, (match, key) => context[key.trim()]);
  };
  /**
   * 获取管理员准许投稿后，审稿群的actionMsg文案
   * @param  {Object} message Message   稿件
   * @return {[type]}         [description]
   */
  getAdminActionFinish (message) {
    let text = this.getAdminCommonHeader(message);
    text += "\n" + this.getAdminreader(message);
    text += "\n" + this.get('admin_finish_label');
    let comment = this.getAdminComment(message)
    if (comment) {
      text += "\n\n" + this.get('admin_finish_comment', { comment });
    }
    return text;
  };
  /**
   * 获取管理员对消息的评语
   * @param  {[type]} message [description]
   * @return {string}         存在则返回，没有则返回空
   */
  getAdminComment (message) {
    let params = message.receive_params;
    return params ? params.comment : false;
  };
  getAdminActionReject (message, reason) {
    let text = this.getAdminCommonHeader(message);
    text += "\n" + this.getAdminReject(message);
    text += "\n" + this.get('admin_reject_label', { reason });
    return text;
  };
  getAdminReject (message) {
    let userinfo = this.getUser(message.reject);
    return this.get('admin_reject', userinfo);
  };
  getAdminreader (message) {
    let userinfo = this.getUser(message.receive);
    return this.get('admin_reader', userinfo);
  };
  /**
   * 获取推送到频道内容的页脚版权文本
   * via xxxx
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getViaInfo (message) {
    let msgInfo = this.getMessageFwdFromInfo(message);
    let text = '';
    if (msgInfo.type == 'channel_private') {
      text = this.get('via_channel_private', msgInfo)
    } else if (msgInfo.type == 'channel') {
      text = this.get('via_channel', msgInfo)
    } else if (msgInfo.type == 'forward_user' || msgInfo.type == 'user') {
      text = this.get('via_user', msgInfo);
    }
    return text;
  };
  /**
   * 获取投稿人username, userid
   * @param  {[type]} message [description]
   * @return {Object}        {username, userid}
   */
  getUser (user) {
    let lastName = user.last_name || '';
    let firstName = user.first_name || '';
    let username = firstName + ' ' + lastName;

    if (!username) {
      if (user.username) {
        username = user.username;
      } else {
        username = 'NoName';
      }
    }
    let userid = user.id;
    return {username, userid}
  };
  /**
   * 获取转发信息的来源
   * 是转发个人的，还是频道的，还是私人频道的，得到这个信息
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getMessageFwdFromInfo (message) {
    let resp = {};
    // 投稿者转发频道
    let fwdChannel = message.forward_from_chat;
    let fwdUser = message.forward_from;
    let user = message.from;
    if (fwdChannel) {
      let username = fwdChannel.username;
      if (!username) {
        resp = {type: 'channel_private', channel: fwdChannel.title};
      } else {
        resp = {type: 'channel', username, channel: fwdChannel.title, id: message.forward_from_message_id}
      }
    } else if (fwdUser) {
      // 投稿者转发自别人
      resp = this.getUser(fwdUser);
      resp.type = 'forward_user';
    } else {
      resp = this.getUser(user);
      resp.type = 'user';
    }
    return resp;
  };
  /**
   * 获取来源(如果是转发别人的信息): @xxx 一行
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getFromText (message) {
    let fwdInfo = this.getMessageFwdFromInfo(message);
    let text = '';
    if (fwdInfo.type == 'channel_private') {
      text = this.get('sub_from_channel_private', fwdInfo)
    } else if (fwdInfo.type == 'channel') {
      text = this.get('sub_from_channel', fwdInfo)
    } else if (fwdInfo.type == 'forward_user') {
      text = this.get('sub_from', fwdInfo);
    }
    return text;
  };
  /**
   * 得到 来源保留：保留/匿名 这一行
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  getFromReserve (type) {
    let text = this.get('from_real');
    if (type == this.vars.SUB_ANY) {
      text = this.get('from_anonymous');
    }
    text = this.get('sub_from_reserve', {reserve: text});
    return text;
  };
  /**
   * 获取投稿人:@xxx 一行
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getSubUser (message) {
    return this.get('sub_people', this.getUser(message.from));
  };
  /**
   * 获取一行： 更多帮助 [/command] 的文本
   * @return {[type]} [description]
   */
  getMoreHelp () {
    return this.get('admin_morehelp', {command: '/pwshelp'});
  };
  /**
   * 获取审稿群通用头部
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  getAdminCommonHeader (message) {
    let text = this.get('sub_new') + "\n" + this.getSubUser(message);
    // 是投稿人转发的信息，获取消息之来源
    if (message.forward_date) {
      text += "\n" + this.getFromText(message);
    }
    text += "\n" + this.getFromReserve(message.sub_type);
    return text;
  };
  /**
   * 机器人将稿件转发至审稿群后，询问管理员如何操作的文案
   * 如 新投稿\n投稿人:xx\n...
   * @param  {String} type    操作类型
   * @param  {Object} message 稿件
   * @return {[type]}         [description]
   */
  getAdminAction (message) {
    let text = this.getAdminCommonHeader(message);
    text += "\n\n" + this.getMoreHelp();
    return text;
  };
}

export default Lang;
