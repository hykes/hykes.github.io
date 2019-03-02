# SOAP1.1与SOAP1.2的区别

## WebService
WebService只采用HTTP POST方式传输数据，不使用GET方式。普通HTTP POST的contentType 为 application/x-www-form-urlencoded,WebService从数据传输格式上作了限定，其使用的数据传输格式是基于XML格式的。目前标准的WebService在数据格式上主要采用SOAP协议。

## SOAP
SOAP – Simple Object Access protocol 简单对像访问协议，一种基于XML编码规范的文本协议。是运行在HTTP协议基础之上的协议。其实就是在HTTP协议是传输XML文件，就变成了SOAP协议。

## SOAP1.1与SOAP1.2的区别

1. SOAP1.1版本与SOAP1.2版本在头信息上存在差异。SOAP1.1存在SOAPAction的请求头，SOAP1.2没有SOAPAction的请求头。
2. SOAP1.1协议使用的contentType是 text/xml，而SOAP1.2使用的是 application/soap+xml。
3. Soap1.1的命名空间`xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"`;Soap1.2的命名空间`xmlns:soap="http://www.w3.org/2003/05/soap-envelope"`。

最后使用jaxb实现一个简单的[web service client(http://github.com/hykes/ws-client)。

!> 本文基于 [知识共享署名-相同方式共享 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh) 国际许可协议发布，欢迎转载，演绎或用于商业目的，但是必须保留本文的署名及链接。

