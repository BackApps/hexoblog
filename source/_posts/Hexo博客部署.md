---
title: Hexo博客部署
date: 2017-05-30 23:27:59
tags: hexo
---

本篇是在VPS上搭建Hexo静态博客的第一篇博文，写本篇的目的一是纪念一下，二是作为一个部署文档保留。

# 相关描述

VPS环境是在[搬瓦工](https://bwh1.net/clientarea.php?action=products)上安装的centos6（x86），1核，512MB，10GB，1000GB/月的配置（$19.99/年，可用支付宝支付），主要的功能是搭个梯子，只做梯子好像有点浪费，于是买了个域名，搭建了这个博客。

Hexo好早之前有听说了，尤其喜欢next主题，简洁大方，考虑到VPS环境的不稳定问题，所以使用github作为博文的中转及保存的仓库，利用github的webhooks，当有push操作时直接发送请求，VPS监听该请求并执行更新操作，这样即使VPS环境挂了，博文信息还在github上，重新部署一遍就可以了。

# 具体过程

主要的步骤有：Hexo本地环境搭建、github仓库创建、webhooks创建、VPS服务器Hexo下载安装、VPS监听和更新脚本。

##  Hexo本地环境搭建

关于Hexo本地环境搭建比较简单，直接参考[Hexo](https://hexo.io/zh-cn/docs/index.html),这里只做简单的记录：

```
npm install -g hexo-cli

hexo init hexoblog

cd hexoblog

npm install

# 新增文章
hexo new <title> 

# 生成静态文件
hexo generate

# 简写
hexo g

# 启动服务，查看博文
hexo server
```

有关Hexo主题，本人比较喜欢[next](https://github.com/iissnan/hexo-theme-next)，最近好像有点样式的调整，不是特别喜欢，所以使用的还是原有的旧版。

## github仓库创建

github远程仓库创建so easy，直接进入github仓库tab页面，点击创建即可。为了提交本地hexo相关文件的方便，我在github上配置了本地环境的ssh公匙信息，以达到不用输入用户名密码即可使用git命令将更改的文件提交到github相关仓库上。

### 具体配置过程

首先在本地环境配置生成秘钥文件，使用git的命令客户端

```
# 检查本地环境是否已有生成的密匙信息
cd ~/.ssh
# 如果没有.ssh目录文件，执行下面命令，直接一路回车
ssh-keygen -t rsa
```
生成如下结构
```
.
├── id_rsa
├── id_rsa.pub
└── known_hosts
```
直接拷贝id_rsa.pub里面的内容，并在github-setting-SSH and GPG keys中创建SSH key，粘贴内容到Key中，title可不填，保存后title直接显示所添加主机的主机名。

## webhooks创建

钩子的创建在github上配置非常简单，进入到仓库页面，点击Settings-Webhooks，直接Add webhooks，这里只选择监听push事件，push事件发生后github将发送请求到VPS监听的URL（http://host:监听端口/webhooks/push/123 ）  上，VPS负责相关的更新操作。

## VPS服务器安装Hexo

与本地安装一样，执行
 ```
 npm install -g hexo-cli
 ```
 即可（当然首先需要安装nodejs环境）
 

## VPS监听

最近一直研究Nodejs，所以在VPS上使用Nodejs启动监听服务，非常简单：

``` javascript
// hexowebhooks.js

var http = require('http')
var exec = require('child_process').exec

http.createServer(function (req, res) {
    if(req.url === '/webhooks/push/123'){
        exec('sh ./deploy.sh');
    }
    res.end()
}).listen(监听端口)
```

其中，deploy.sh为更新脚本，用于更新VPS静态博文，将监听端口更换成你要监听端口即可。这里使用pm2管理监听服务。

运行
```
pm2 start hexowebhooks.js
```

## 更新脚本

更新脚本使用shell脚本，主要步骤是：
- 清除静态文件
- 删除db.json文件（不然pull github代码有冲突）
- 拉github上的代码
- 生成静态文件

**在执行shell之前**，需要先将github仓库代码pull下来，设置远程仓库信息
```
git clone https://github.com/tonny0812/hexoblog.git
或者
git clone git@github.com:tonny0812/hexoblog.git

cd hexoblog

git remote add hexo "git@github.com:tonny0812/hexoblog.git"
```
其中，hexo是远程仓库地址的别名。

更新脚本：
``` shell
// deploy.sh

hexo clean
rm -f ./db.json
git pull hexo master
hexo g
```
然后访问博客网址即可，这里使用nginx反向代理，将静态网页内容映射到80端口上，由于VPS在美国，所以不需要备案即可访问80端口，国内的VPS（如阿里云）需要备案，查到使用HTTPS监听443端口不需要备案可以使用，还没有去折腾。

# 总结

这里的关键是使用了github的webhooks钩子机制，可以利用github这种免费的git数据仓库保存文章信息，VPS直接拉github上的代码，然后执行更新脚本，发布文章，由于使用nginx做代理，所以直接执行完更新脚本之后就可以直接访问新写的文章了。
