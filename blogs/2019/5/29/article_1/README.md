# Dubbo问题排查

## Dubbo服务生产者使用内网IP注册，导致消费者无法访问生产者提供的服务 

Dubbo服务的消费者在向Zookeeper服务中心寻找服务的时候，Zookeeper将Dubbo服务生产者的内网地址给了消费者，所以才会出现：client(省略具体的服务全称) failed to connect to server /10.47.184.10:20880。如果这个内网对生产者是不可达的，那么消费者就无法访问生产者提供的服务。

定位了问题，那么这个问题是怎么造成的呢？

这是由于在Dubbo服务生产者所在机器的hosts配置文件中，将主机名指向了内网IP地址。因此需要其改回具体的公网IP地址或者直接删除，重新启动服务就可以解决问题。