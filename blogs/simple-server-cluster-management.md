# 简单服务器集群管理

本篇是以开发者的视角进行，非专业运维视角，开发管理服务器集群，也许仅仅是自己的项目，或者是在创业公司而没有专业的运维。
开发管理服务器集群，用各种工具需要付出一定的学习成本，但开发者的主要工作不在于此，所以我们需要最简单又比较安全的管理方法，以下是一个对开发者比较好的管理服务器方案，希望对大家有帮助
实现方法
现有服务器 A、B、C 三台服务器，我们将 A 作为部署维护服务器，连接 B、C 进行操作。
首先更改服务器名 sudo vim /etc/hostname，以使得每个服务器有易于你标识的名字，让我们操作服务器时根据提示符知道我们现在操作哪一台服务器。
查看系统网络信息 ifconfig，这一步是获取服务器的 IP 地址。
我使用的服务器是 Ubuntu，Ubuntu 更新 sudo apt update，16.04 以上版本可使用 apt 代替 apt-get。
安装 SSH 服务 sudo apt install ssh。
禁用防火墙，不禁用无法连接用 SSH 连接服务器，禁用命令 sudo ufw disable，当然更安全的做法是只允许特定端口可访问，这里为了简单直接禁用了防火墙。
SSH 连接命令 ssh -p 端口号 username@xxx.xxx.xxx.xxx，端口非必须，默认22。
默认 SSH 使用密码进行连接，更安全的方式是使用密钥进行连接，在 of 上使用 ssh-keygen 创建密钥，会在家目录的 .ssh 目录中生成 id_rsa 和 id_rsa.pub 这两个私钥和公钥。将公钥上传到 B 和 C 中，可以使用 scp 命令或者 ssh-copy-id 命令。
踩坑：配置ssh免密码登录后，仍提示输入密码
SSH 不希望 home 目录和 ~/.ssh 目录对组有写权限，进行以下修改:
chmod g-w /home/dongm2ez
chmod 700 /home/dongm2ez/.ssh
chmod 600 /home/dongm2ez/.ssh/authorized_keys在 B 和 C 的家目录创建 .ssh 目录，使用 cat path/to/id_rsa.pub >> authorized_keys 将秘钥内容加入到认证文件中。同时给予其权限 chmod 600 authorized_keys
在 of 的 ~/.ssh/config 文件中可以配置 ssh 连接信息。
Host B
HostName xxx.xxx.xxx.xxx
User 用户名
Port 端口号

Host C
HostName xxx.xxx.xxx.xxx
User 用户名
Port 端口号

...这样就可以使用 ssh hostname 进行主机连接了，每新加一台管理服务器只需更新这个文件就可。
同时为了安全应该禁用 root 用户登录 和 密码登录，使用 sudo vim /etc/ssh/sshd_config 编辑文件，进行以下修改。
RSAAuthentication yes #开启RSA验证
PubkeyAuthentication yes #是否使用公钥验证
PasswordAuthentication no #禁止使用密码验证登录
PermitRootLogin no #禁止root用户登录总结
这样的服务器管理方法对于管理几台或十几台服务器是对开发者比较好的，简单也安全。
对于更多的服务器管理，我们就需要工具和自动化脚本了
