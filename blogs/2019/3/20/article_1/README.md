# 获取和调试RocketMQ源码

## 获取源码

> RocketMQ最早由阿里巴巴开源，并于2017年提交到Apache基金会成为Apache基金会的顶级项目。

GitHub代码仓库地址：[https://github.com/apache/rocketmq.git](https://github.com/apache/rocketmq.git)

将源码克隆至本地：

```
git clone https://github.com/apache/rocketmq.git
```

## 调试源码

在 IDEA 中启动NameServer、Broker，并运行消息发送和消息消费示例。

### 启动NameServer

1. 在本地创建 RocketMQ 运行主目录 (此处命名为rocketmq_home)。

2. 在主目录创建 conf、logs、store 三个文件夹。

3. 从源码的distribution部署目录中将 logback_namesrv.xml 文件复制到 conf 目录中。logback_namesrv.xml 文件只需要修改日志文件的目录(此处配置为${ROCKETMQ_HOME}/logs/xxx.log)。

4. 配置 Configurations

![IMAGE](CB13ABAD11C2007C26A18B9A0C0FF101.jpg ':size=863x585')

注意：需要配置环境变量 ROCKETMQ_HOME，值为运行主目录路径。

5. 在 IDEA 中 Debug 运行 NamesrvStartup，可以看到输出:

![IMAGE](8B16732DF8F196593FF48091E30754E8.jpg ':size=803x346')

### 启动Broker

1. 从源码的distribution部署目录中将 broker.conf、logback_broker.xml 文件复制到 conf 目录中。logback_broker.xml 文件只需要修改日志文件的目录(此处配置为${ROCKETMQ_HOME}/logs/xxx.log)，broker.conf 文件配置如下：

```
brokerClusterName=DefaultCluster
brokerName=broker-a
brokerId=0
deleteWhen=04
fileReservedTime=48
brokerRole=ASYNC_MASTER
flushDiskType=ASYNC_FLUSH
#指定公网地址，这是个坑，不指定事出现了一个不知道哪里的IP。
brokerIP1=127.0.0.1
#nameServer地址，分号分割
namesrvAddr=127.0.0.1:9876
#存储路径
storePathRootDir=${ROCKETMQ_HOME}/store
#commitLog存储路径
storePathCommitLog=${ROCKETMQ_HOME}/store/commitlog
#消费队列存储路径
storePathConsumeQueue=${ROCKETMQ_HOME}/store/consumequeue
#消息索引存储路径
storePathIndex=${ROCKETMQ_HOME}/store/index
#checkpoint文件存储路径
storeCheckpoint=${ROCKETMQ_HOME}/store/checkpoint
#abort文件存储路径
abortFile=${ROCKETMQ_HOME}/store/abort
```

2. 配置 Configurations

![IMAGE](4202024B4F6847C95FF93676AC8FA79F.jpg ':size=863x600')

注意：同样需要配置环境变量 ROCKETMQ_HOME，同时还需要配置参数 -c <运行主目录路径>

3. 在 IDEA 中 Debug 运行 BrokerStartup

4. 查看日志文件 ${ROCKETMQ_HOME}/logs/broker.log，未报错则表示启动成功：

![IMAGE](37710B7DE7CBE2C129B9108F83174A09.jpg ':size=1125x511')

### 使用RocketMQ提供的实例验证消息发送与消息消费

1. 修改 org.apache.rocketmq.example.quickstart.Producer 示例程序，设置消费生产者NameServer地址，示例如下：

```java
public class Producer {
    
    public static void main(String[] args) throws MQClientException, InterruptedException {

        DefaultMQProducer producer = new DefaultMQProducer("please_rename_unique_group_name");
        producer.setNamesrvAddr("127.0.0.1:9876");
        producer.start();

        for (int i = 0; i < 1; i++) {
            try {
                Message msg = new Message("TopicTest", "TagA",
                    ("Hello RocketMQ " + i).getBytes(RemotingHelper.DEFAULT_CHARSET)
                );

                SendResult sendResult = producer.send(msg);
                System.out.printf("%s%n", sendResult);
            } catch (Exception e) {
                e.printStackTrace();
                Thread.sleep(1000);
            }
        }
        producer.shutdown();
    }
}
```

2. 运行该示例，查看运行结果。若如下图所示结果则表示消息发送成功。

![IMAGE](C5B19B2278D4EF172503A8FC401BF886.jpg ':size=821x363')

3. 修改 org.apache.rocketmq.example.quickstart.Consumer 示例程序，设置消费生产者NameServer地址，示例如下：

```java
public class Consumer {

    public static void main(String[] args) throws InterruptedException, MQClientException {

        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("please_rename_unique_group_name_4");
        consumer.setNamesrvAddr("127.0.0.1:9876");
        consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);
        consumer.subscribe("TopicTest", "*");

        consumer.registerMessageListener(new MessageListenerConcurrently() {

            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs,
                ConsumeConcurrentlyContext context) {
                System.out.printf("%s Receive New Messages: %s %n", Thread.currentThread().getName(), msgs);
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });

        consumer.start();
        System.out.printf("Consumer Started.%n");
    }
}
```

4. 运行该示例，查看运行结果。若如下图所示结果则表示消息消费成功。

![IMAGE](09B070C4CDA1F3BF4B86CCF69D37BBFD.jpg ':size=874x315')

**消息发送与消息消费都成功了，说明我们的 RocketMQ 调试环境已经成功搭建了。接下来，我们可以直接 Debug 源码，开始探索 RocketMQ的实现奥秘了。**

