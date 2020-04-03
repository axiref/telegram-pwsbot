# PWS - Telegram投稿机器人

[![Build Status](https://travis-ci.org/axiref/telegram-pwsbot.svg?branch=master)](https://travis-ci.org/axiref/telegram-pwsbot)
![](https://img.shields.io/badge/license-MIT-green.svg)

此机器人帮助订阅者向频道投稿，支援多图(MediaGroup)投稿、稿件附加评论、夜间自动消音推送、多语言、黑名单等功能。

# 安装

先克隆项目
```bash
git clone https://github.com/axiref/telegram-pwsbot
cd telegram-pwsbot
npm install
```
然后创建配置文件，直接复制一份 `env.example`

```bash
cp env.example .env
vim .env
```

请务必填写下列参数：

- `Token`，机器人的令牌，可透过 [@botfather](https://t.me/botfather) 获取
- `Admin`，管理员，可透过 [@userinfobot](https://t.me/userinfobot) 获取，将**数字**ID复制填写
- `Channel`，要投稿到的频道，填写格式为`@频道ID`，如`@ruanyuww`

另外你可以设置下列可选参数：

- `AutoMute`，夜间静音推送(00:00AM~7:00AM)，留空则禁用，需填写时区 ([时区列表](http://php.net/manual/zh/timezones.php))

- `Lang`，语言，可选 `zh-CN`、`zh-TW`，分别为中文简体🇨🇳，中文正体🇹🇼

  你可以修改和添加自己的语言，在 `/src/lang`目录下，`<语言名>.json`命名的文件

> 注意：每次修改.env配置文件，都需要重新启动项目

填写完毕后，使用 

```bash
npm run start
```

即可运行项目，此时你可以观察终端有没有报错

若一切正常，但也请不要就这样运行项目，这样并不安全，你的机器人**一定会罢工**

**强烈**推荐使用 [PM2](https://www.npmjs.com/package/pm2) 来守护进程

使用下列命令安装 PM2

```bash
npm install pm2 -g
```

由于此项目目录已经携带了PM2的配置文件，你只需要在项目目录下运行

```bash
pm2 start
```

就可以看到名为 `pwsbot`的任务已经被运行，重启项目可使用 `pm2 restart pwsbot` 命令来完成。

项目启动后，必须将你的机器人添加到审稿群，机器人会将收到的稿件转发至审稿群，群内所有人皆可审核稿件，如果你没有审稿群，你应该建立一个。

将机器人加到审稿群后，**务必在审稿群使用** `/setgroup` 命令来初始化机器人 (此命令可设置当前群为审稿群)，只需运行一次。

然后需要将机器人添加到频道，普通的添加是无法将机器人添加到频道，你应该点开频道管理员列表，新增一个管理员，然后输入机器人的username，透过这样的方式才能将机器人添加到频道。

> 机器人在审稿群可以不是管理员，但在频道需要是管理员。

由此，部署完毕，你的投稿机器人应该已经可以正常工作了 🎉

# 命令

| 命令             | 说明                                                  | 场景     |
| ---------------- | ----------------------------------------------------- | -------- |
| /start           | 显示投稿说明                                          | 仅私聊   |
| /version         | 显示机器人版权                                        | 私聊和群 |
| /setgroup        | 设置当前群为审稿群<br />**必须设置审稿群**            | 群       |
| /ok <评论>       | 通过一个稿件，也可附加评论<br />也可直接`/ok`通过稿件 | 群       |
| /no <理由>       | 拒绝一个稿件，需附加理由                              | 群       |
| /re <回复内容>   | 回复一个稿件，需回复内容                              | 群       |
| /ban <用户ID>    | 回复稿件或者输入ID可拉黑一个用户                      | 群       |
| /unban <用户ID>  | 回复稿件或者输入ID可解除拉黑一个用户                  | 群       |
| /unre <用户ID>   | 结束用户的对话状态                                    | 群       |
| /pwshelp         | 显示更多可对稿件采取的命令                            | 群       |
| /echo <回复内容> | 回复给用户一次，但不进入对话模式                      | 群       |




# License

MIT

