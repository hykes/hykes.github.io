# Linux下的/usr/bin、/usr/sbin 、/usr/local/bin的区别

## 区别

首先注意 usr 指 Unix System Resource，而不是指 User 。

- /usr/sbin：root权限下的命令属于基本的系统命令，如shutdown，reboot，用于启动系统，修复系统；
- /usr/bin：系统预装的可执行程序，会随着系统升级而改变，如ls,chmod等；
- /usr/local/bin: 给用户放置自己的可执行程序的地方，推荐放在这里，不会被系统升级而覆盖同名文件。

如果两个目录下有相同的可执行程序，谁优先执行受到PATH环境变量的影响，比如我的电脑PATH(echo $PATH)变量为：

```
/Users/langxiao/bin /usr/local/bin /usr/bin /bin /usr/sbin /sbin /usr/local/go/bin /usr/local/mysql/bin
```

通常/usr/local/bin优先于/usr/bin。

## 一个良好习惯

创建软链接

```
ln -s elasticsearch-6.1.3 elasticsearch
```

生成一个elasticsearch来作为elasticsearch-6.1.3的映射，平常在别的地方要用到指向elaticsearch时直接指的是不带版本号的软链接。这样在以后升级elasticsearch到别的版本的时候不致于是影响太多，只需要重新作软链接即可。
