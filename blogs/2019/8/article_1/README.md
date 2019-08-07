
# 如何调试远程Java代码

## JPDA概念

JPDA(Java Platform Debugger Architecture) 是 Java 平台调试体系结构的缩写，通过 JPDA 提供的 API，开发人员可以方便灵活的搭建 Java 调试应用程序。JPDA 主要由三个部分组成：Java 虚拟机工具接口（JVMTI），Java 调试线协议（JDWP），以及 Java 调试接口（JDI）

JDWP（Java Debug Wire Protocol）是一种应用进程与调试进程通信的协议，用于远程调试Java应用。

调试平台通过调试交互协议向java虚拟机请求服务，以对在虚拟机中运行的程序进行调试。

## 开启服务调试模式

1.前置条件

> idea的代码和远程服务器代码保持一致

2.在远程服务的JVM参数中加入

```java
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8085
```

transport=dt_socket 指定运行的被调试应用和调试者之间的通信协议.
address=8085 远程被调试应用开通的端口,可定义其他端口.
server=y 表示这个 JVM 即将被调试
suspend=n 用来告知 JVM 立即执行，不要等待未来将要附着上/连上（attached）的调试者。如果设成 y, 则应用将暂停不运行，直到有调试者连接上

suspend=y的一个比较适用的场景是，当debug一个会阻止应用成功启动的问题时， 通过suspend=y可以确保调试者连上来之后再启动应用，否则应用已经启动报错了再调试也没意义了。


如果JDK版本小于5.0版本，使用以下配置:
```java
-Xdebug -Xrunjdwp:transport=dt_socket,server=y,address=1043,suspend=n
```

## IDEA远程调试配置步骤

1.Run -> Edit Configurations.

![IMAGE](A8886A050ADC259919ACDB49526415FF.jpg ':size=378x617')

2.选择Remote，填入相应的IP地址以及端口

![IMAGE](1C40D0DADD9A5193D06809F1225F1CB2.jpg ':size=862x617')

3.使用Debug模式启动Remote

![IMAGE](76F4CCE6AA17D20F94057B1DD0D61D5F.jpg ':size=710x320')

4.从上图可以看出，成功连接上远程服务，开始调试远程吧！