---
title: 利用VPS搭建天梯
date: 2017-08-08 21:01:57
tags: VPN
---

距离上次写东西已经有三个月了，如题，上次记录了如何保存博文到github并与VPS上的博客服务保持同步，这次记录一下如何部署天梯（话说现在封的这么厉害，也不知道以后还能不能用了(⊙﹏⊙)b）。

# 相关描述

搭梯子的原理无外乎是建立一条管道，本地的发送请求通过这条管道可以获取到到你要的响应信息，普通发送请求有些网址是无法访问的，原因基本上是要么本来你要访问的地址就不存在，或则有人在请求的连路上做了手脚，导致无法访问。

基于上述原理，要想能够访问到被截取的信息，需要两个条件：
 - 一台能访问到外网并拥有独立IP的机器（比如在美国的一台VPS）；
 - 一条不受监控的通信管道（比如[Shadowsocks](https://github.com/shadowsocks/shadowsocks/wiki)）

第一个条件花点大洋就能搞定，这里我使用的是在[搬瓦工](https://bwh1.net/clientarea.php?action=products)上买的VPS，安装了centos6（x86），一年130RMB左右，性价比挺高。第二个条件在这里使用Shadowsocks，原版的ss是使用python写的，不过作者由于是国人，被约去喝茶了，现在github上找到相应的软件代码比较困难，但是有人基于python版的ss封装了一个[nodejs版](https://github.com/shadowsocks/shadowsocks-nodejs)的，所以第二个条件也满足了，那么就开动吧。

# 具体过程

## 服务器端
使用远程登陆工具登陆到VPS上（如putty等），要想使用ss-nodejs版需要在VPS上安装nodejs，具体安装过程略过，安装完成之后使用nodejs包管理工具npm全局安装ss-nodejs。

```
npm install -g shadowsocks
```

下载安装完成之后，需要配置相关设置，一般npm全局安装路径为/usr/local/lib/node_modules，可以使用下面的命令查看：
```
npm root -g
```
进入到/usr/local/lib/node_modules/shadowsocks下，编辑文件config.json，主要是进行加密处理的。配置完成后请记住相应的信息，这些信息需要与本地的ss配置一致。

```
// config.json

{
    "server":"my_server_ip",
    "server_port":8888,
    "local_port":1080,
    "password":"***密码***",
    "timeout":600,
    "method":"table",
    "local_address":"127.0.0.1"
}

```

OK，文件配置完之后就可以启动服务了，这里使用pm2进行服务的启动，pm2可以对服务进行管理，如果服务挂了，它可以自动启动服务。

```
# 安装pm2
npm install -g pm2

# 启动 ss服务
pm2 start ssserver
```

## 本地端

要建立管道必须要在本地建立与服务器通信的连接，在这里仍然使用ss-nodejs版，安装过程与在服务器一致，具体配置也一样，不然没有办法通信。

本人本地环境是windowns，所以在启动本地ss服务上使用一个bat脚本，这样在我需要翻的时候直接双击执行脚本就可以了，比较方便。

```
// shadowsocks.bat

sslocal -c ./config.json
```
其中，config.json就是在服务器中配置的文件，我将它与bat文件放到一起，方便维护。

双击 shadowsocks.bat就可以看到本地的ss服务于VPS上的ss服务正常连接通信了，但是这里还有一个问题，就是如何让浏览器将发送的请求走建立起来的管道，而不是直接获取响应。

我这里使用的是chrome浏览器，使用chrome浏览器插件[SwitchyOmega](https://switchyomega.com/download.html)，该插件可以通过设定规则来决定你要访问的页面是通过管道发送出去，还是通过直接访问的方式发送。访问规则使用[规则](https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt)，然后选择自动切换模式就可以轻松上网了，什么google、YouTube等等就都可以了。

# 总结

通过建立加密的管道，使得我们的请求能够不被墙掉，同时兼顾访问响应速度方面，使用SwitchyOmega作为代理的切换工具，使得我们的视野更加开阔（现在出台的政策听说好严格，个人的VPN要被封了，/(ㄒoㄒ)/~~，希望不要啊~）。