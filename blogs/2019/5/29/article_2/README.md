# RocketMQ问题排查

## RocketMQ消费能力慢的优化方案

RocketMQ是解决数据同步的一个中间件，那么生产者与消费者之间的速度不一致对系统造成的压力是可想而知的，如果生产者发送消息的速度远远大于消费者消费的速度消息会不及时，而且还会造成数据堆积，可能还会引发各种各样的问题。

RocketMQ消费速度提不上去的几种常见的处理方式如下：

1. 提高消费并行读 
    
    1.1 同一个ConsumerGroup下，通过增加Consumer实例的数量来提高并行度，超过订阅队列数的Consumer实例无效。可以通过添加机器或者在已有的机器启动多个进程的方式提高并行度 
    1.2 提高单个Consumer的消费并行线程，通过修改Consumer的consumerThreadMin和consumerThreadMax来设置线程数 

2. 批量方式消费 
    
    某些业务流程如果支持批量的方式消费，则可以很大程度上提高消费吞吐量，例如订单扣款类应用，一次处理一个订单耗时1秒，一次处理是个订单可能也只耗时2秒，这样就可大幅度提高消费的吞吐量，通过设置Consumer的consumerMessageBathMaxSize这个参数，默认是1，一次只消费一条消息，例如设置N，那么每次消费的消息条数小于等于N 

3. 跳过非重要消息 
    
    一般不会这样，除非消息对完整性要求不高，当消息发生堆积时，如果消费速度跟不上消费速度，可以选择丢弃一些不重要的消息，一般跟不上是在高峰期，如果一直跟不上，那就是这个系统的问题了。 

4. 优化消息消费的过程 
    
    对于消费消息的过程一般包括业务处理以及跟数据库的交互，可以试着通过一些其他的方法优化消费的逻辑。
