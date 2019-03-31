# 使用Apache ab进行压力测试

ab是apache自带的压力测试工具，非常实用。ab命令会创建多个并发访问线程，模拟多个访问者同时对某一URL地址进行访问。

使用ab工具模拟多线程并发请求，对发出负载的机器要求比较低，既不会占用很多cpu，也不会占用很多的内存。但却会给目标服务器造成巨大的负载，因此也是很多DDoS攻击的必备良药，所以要慎用，别耗光自己机器的资源。

ab的安装非常简单，如果是源码安装apache，安装完毕后ab命令存放在apache安装目录的bin目录下。如果通过yum的RPM包方式安装的话，ab命令默认存放在/usr/bin目录下。

[Apache ab docs](http://httpd.apache.org/docs/2.4/zh-cn/programs/ab.html)

## ab命令格式
```bash
ab [options] [http[s]://]hostname[:port]/path
```

可以这样写：

```bash
ab -c 200 -n 5000 http://127.0.0.1:8080/api/items/1
```
-c表示模拟200个并发，-n表示整个过程发出5000个请求。

也可以这样写：

```bash
ab -t 60 -c 200 http://127.0.0.1:8080/api/items/1
```

-t表示60秒，-c表示200个并发，会在连续60秒内不停的发出请求。

还可以这样写：

```base
ab -t 60 -c 200 -p body.txt -T application/json -H "cookie: taid=95e79948-1a3b-4812-af50-a4f33e49f7e8;" -H "User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36" http://127.0.0.1:8080/api/login
```
-p 表示POST请求，body.text表示请求参数的数据文件(内容可以是json格式，也可以是query params格式)，-T表示所使用的Content-type头信息，-H表示请求头信息。

## 具体参数说明

```
-n 在测试会话中所执行的请求个数（总数）
-c 一次产生的请求个数（单次请求次数）
-t 测试所进行的最大秒数。其内部隐含值是-n 50000，它可以使对服务器的测试限制在一个固定的总时间以内。默认时，没有时间限制。
-p 包含了需要POST的数据的文件。
-P 对一个中转代理提供BASIC认证信任。用户名和密码由一个:隔开，并以base64编码形式发送。无论服务器是否需要(即, 是否发送了401认证需求代码)，此字符串都会被发送。
-T POST数据所使用的Content-type头信息。
-v 设置显示信息的详细程度-4或更大值会显示头信息，3或更大值可以显示响应代码(404,200等),2或更大值可以显示警告和其他信息。
-V 显示版本号并退出。
-w 以HTML表的格式输出结果。默认时，它是白色背景的两列宽度的一张表。
-i 执行HEAD请求，而不是GET。
-X 对请求使用代理服务器。
-C 对请求附加一个Cookie:行。其典型形式是name=value的一个参数对，此参数可以重复。
-H 对请求附加额外的头信息。此参数的典型形式是一个有效的头信息行，其中包含了以冒号分隔的字段和值的对(如,"Accept-Encoding:zip/zop;8bit")。
-A 对服务器提供BASIC认证信任。用户名和密码由一个:隔开，并以base64编码形式发送。无论服务器是否需要(即,是否发送了401认证需求代码)，此字符串都会被发送。
-h 显示使用方法/帮助信息。
```

## ab性能指标

```
在进行性能测试过程中有几个指标比较重要：

1、吞吐率（Requests per second）

服务器并发处理能力的量化描述，单位是reqs/s，指的是在某个并发用户数下单位时间内处理的请求数。某个并发用户数下单位时间内能处理的最大请求数，称之为最大吞吐率。

吞吐率是基于并发用户数的。这句话代表了两个含义：
a、吞吐率和并发用户数相关
b、不同的并发用户数下，吞吐率一般是不同的

计算公式：总请求数/处理完成这些请求数所花费的时间，即Request per second=Complete requests/Time taken for tests必须要说明的是，这个数值表示当前机器的整体性能，值越大越好。

2、并发连接数（The number of concurrent connections）

并发连接数指的是某个时刻服务器所接受的请求数目，简单的讲，就是一个会话。

3、并发用户数（Concurrency Level）

要注意区分这个概念和并发连接数之间的区别，一个用户可能同时会产生多个会话，也即连接数。在HTTP/1.1下，IE7支持两个并发连接，IE8支持6个并发连接，FireFox3支持4个并发连接，所以相应的，我们的并发用户数就得除以这个基数。

4、用户平均请求等待时间（Time per request）

计算公式：处理完成所有请求数所花费的时间/（总请求数/并发用户数），即：Time per request=Time taken for tests/（Complete requests/Concurrency Level）

5、服务器平均请求等待时间（Time per request:across all concurrent requests）

计算公式：处理完成所有请求数所花费的时间/总请求数，即：Time taken for/testsComplete requests。可以看到，它是吞吐率的倒数。同时，它也等于用户平均请求等待时间/并发用户数，即：Time per request/Concurrency Level。
```

## 示例

![IMAGE](C51860AFCF43F2BAC1869ABB88439528.jpg ':size=886x833')

