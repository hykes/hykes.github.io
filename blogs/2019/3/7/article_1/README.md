# 基于消息中间件的分布式事务解决方案

## 场景描述

1. 用户进行验收操作，验收通过时，创建验收单记录和应付单记录。
2. 用户进行付款操作，付款成功时触发核销事件，涉及到付款单、应付单、核销单的创建与更新操作。

## 方案探索

在实际业务场景中，存在一个业务逻辑同时对多个表数据进行插入更新的情况，也存在不同的业务逻辑对同一个表数据进行修改的情况，这些情况使得系统容易产生错乱的数据，所以我们需要用事务来对数据进行管理。

以场景一为例进行编码实现，需要创建一条验收记录、多条验收子记录、多条应付记录。同时为了保证数据的一致性，需要进行事务控制。通常在单体应用并且使用 Spring 框架的情形下，我们直接使用 @Transactional 注解就能管理事务。

伪代码如下(版本一)：

```java
  @Transactional(rollbackFor = Exception.class)
  private Long accepted(FullAcceptRecord fullAcceptRecord) {
      AcceptRecord record = null;
      List<AcceptSkuRecord> skuRecords = null;
      List<ApAr> apArs = null;
      // 创建验收记录
      Boolean success1 = acceptRecordDao.create(record);
      if (!success1) {
          throw new ServiceException("create.fail");
      }
      // 创建验收子记录
      Boolean success2 = acceptSkuRecordDao.creates(skuRecords);
       if (!success2) {
          throw new ServiceException("create.fail");
      }
      // 创建应付记录
      Boolean success3 = apArDao.creates(apArs);
      if (!success3) {
          throw new ServiceException("create.fail");
      }
      return acceptRecord.getId();
  }
```

为了更好的支撑业务发展，我们的项目采用了微服务架构，将系统拆分为多个子应用进行独立部署。版本一三个操作中，创建验收记录和创建验收子记录属于订单中心，创建应付记录属于结算中心，各中心对外提供RPC服务。对版本一代码进行改造，在web层进行服务组合调用。

伪代码如下(版本二)：

```java
  public Response<Long> submit() {
      AcceptRecord record = null;
      List<AcceptSkuRecord> skuRecords = null;
      List<ApAr> apArs = null;
      // 调用订单服务，使用本地事务创建验收记录和验收子记录
      Long recordId = RespHelper.or500(acceptRecordWriteService.create(record, skuRecords));
      // 调用结算服务，创建应付记录
      Response<Boolean> response = aparWriteService.creates(apArs);
      if (!response.isSuccess() || !response.getResult()) {
          // 应付记录创建失败时，对创建验收记录进行回滚操作。
          RespHelper.or500(acceptRecordWriteService.callback(record));
      }
      return Response.ok(record.getId());
  }
```

可以看到为了保证数据的一致性，判断了调用的服务是否成功，失败时编码回滚已经成功的步骤。可想而知，当系统复杂度上升时，调用链路变长，代码逻辑会非常的臃肿。同时又引入了新的问题，调用回滚方法也失败了怎么办？

到了这里，我们先复习一个概念，什么是事务？

我们将由一组操作构成的可靠的、独立的工作单元称之为事务，事务里的所有操作要么全部执行成功，要么全部执行失败。

事务必须服从ACID原则：

- A（Atomic）：原子性，构成事务的所有操作，要么都执行完成，要么全部不执行，不可能出现部分成功部分失败的情况。
- C（Consistency）：一致性，在事务执行前后，数据库的一致性约束没有被破坏。
- I（Isolation）：隔离性，数据库中的事务一般都是并发的，隔离性是指并发的两个事务的执行互不干扰，一个事务不能看到其他事务运行过程的中间状态。
- D（Durability）：持久性，事务完成之后，该事务对数据的更改会被持久化到数据库，且不会被回滚。

**显然版本二是没有进行事务控制的。**

继续思考，除了微服务架构的原因外，当系统的数据规模越来越大时，通常会采用分库分表方式处理。这个时候关系型数据库单机事务的手段，就不再能完全满足业务的发展了。这个时候需要在数据库之上通过某种手段，实现支持跨数据库的事务支持，这也就是大家常说的“分布式事务”。

先来了解与分布式事务相关的知识点：

**CAP理论**

![IMAGE](01.jpg ':size=600x400')

- Consistent一致性: 同样数据在分布式系统中所有地方都是被复制成相同。
- Available可用性: 所有在分布式系统活跃的节点都能够处理操作且能响应查询。
- Partition Tolerant分区容错性: 在两个复制系统之间，如果发生了计划之外的网络连接问题，对于这种情况，有一套容错性设计来保证。

一般情况下，CAP理论认为一个分布式系统不可能同时满足上述三个需求，最多只能同时满足其中两项。也就是说在有网络分区情况下，也就是分布式系统中，不能又要有完美一致性和100%的可用性，只能这在两者选择一个。

**BASE理论**

- 基本可用（BasicallyAvailable）：指分布式系统在出现故障时，允许损失部分的可用性来保证核心可用。
- 软状态（SoftState）：指允许分布式系统存在中间状态，该中间状态不会影响到系统的整体可用性。
- 最终一致性（EventualConsistency）：指分布式系统中的所有副本数据经过一定时间后，最终能够达到一致的状态。

**一致性级别**

- 强一致性：这种一致性级别是最符合用户直觉的，它要求系统写入什么，读出来的也会是什么，用户体验好，但实现起来往往对系统的性能影响大。
- 弱一致性：这种一致性级别约束了系统在写入成功后，不承诺立即可以读到写入的值，也不久承诺多久之后数据能够达到一致，但会尽可能地保证到某个时间级别（比如秒级别）后，数据能够达到一致状态。
- 最终一致性：最终一致性是弱一致性的一个特例，系统会保证在一定时间内，能够达到一个数据一致的状态。这里之所以将最终一致性单独提出来，是因为它是弱一致性中非常推崇的一种一致性模型，也是业界在大型分布式系统的数据一致性上比较推崇的模型。

工程领域主要讨论的是强一致性和最终一致性的解决方案。我们往往为了可用性和分区容错性，忍痛放弃强一致支持，转而追求最终一致性。大部分业务场景下，我们是可以接受短暂的不一致的。更多的时候，分布式事务只需要保证原子性，这个原子性也保证了应用层面上的一致性，而由本地事务来保证隔离性、持久性。

现在再对场景一进行分析，探索出适合的最终一致性方案。首先将单个事务拆分为主事务+从事务，订单中心执行主事务：创建验收记录+创建待消费消息，结算中心执行从事务：创建应付记录+创建已消费消息，只要保证两个事务执行结果一致即可。再次对版本一代码进行改造，这次采用消息表的方式进行应用解偶合。

伪代码如下(版本三)：

```java
  // 主事务应用
  @Transactional(rollbackFor = Exception.class)
  private Long accepted(FullAcceptRecord fullAcceptRecord) {
      AcceptRecord record = null;
      List<AcceptSkuRecord> skuRecords = null;
      MessageA msgA = null;
      // 创建验收记录
      Boolean success1 = acceptRecordDao.create(record);
      if (!success1) {
          throw new ServiceException("create.fail");
      }
      // 创建验收子记录
      Boolean success2 = acceptSkuRecordDao.creates(skuRecords);
       if (!success2) {
          throw new ServiceException("create.fail");
      }
      // 创建待消费消息记录，等待从事务消费
      Boolean success3 = messageADao.create(msgA);
      if (!success3) {
          throw new ServiceException("create.fail");
      }
      return acceptRecord.getId();
  }
  // 从事务应用
  @Transactional(rollbackFor = Exception.class)
  private void accepted(FullApAr fullApAr) {
      MessageB msgB = null;
      List<ApAr> apArs = null;
      // 创建应付记录
      Boolean success1 = apArDao.creates(apArs);
      if (!success1) {
          throw new ServiceException("create.fail");
      }
      // 创建消费消息记录
      Boolean success2 = messageBDao.create(msgB);
      if (!success2) {
          throw new ServiceException("create.fail");
      }
      return acceptRecord.getId();
  }
```

思路：

1. 订单中心新增一张消息表A，把 创建验收记录 和 创建待处理消息记录 这2个操作放在一个DB事务里面。
2. 结算中心新增一张判重表B，把 创建应付记录 和 创建已处理消息记录 这2个操作放在一个DB事务里面。
3. 结算中心通过定时拉取A表未处理的消息，执行步骤2，同时还需要进行判重以及更新A表状态。

显然这个方案的缺点就是：需要设计消息表和判重表，还需要编码实现定时任务功能，额外增加了开发者的负担。

可以发现版本三中两个应用之间的数据传递是从事务方主动拉取需要处理的数据，是pull模式。相对应的，如果使用消息件中间件，让主事务方发送消息，从事务订阅消息，就实现了push模式。这个时候订单中心执行主事务：创建验收记录+发送MQ消息(非事务消息)，结算中心执行从事务消费消息创建的应付记录。

对版本三进行改造，伪代码如下(版本四)：

```java
  @Transactional(rollbackFor = Exception.class)
  private Long accepted(FullAcceptRecord fullAcceptRecord) {
      AcceptRecord acceptRecord = fullAcceptRecord.getAcceptRecord();
      Boolean success = acceptRecordDao.create(acceptRecord);
      if (!success) {
          throw new ServiceException("accept.record.create.fail");
      }
      acceptSkuRecordDao.creates(fullAcceptRecord.getAcceptSkuRecords());
      // 同事务发MQ消息
      AcceptRecordCreateMQEvent event = new AcceptRecordCreateMQEvent(acceptRecord.getId());
      SendResult result = producer.send(event.getTopic(), event.getTag(), event);
      if (!SendStatus.SEND_OK.equals(result.getSendStatus())) {
          throw new ServiceException("accept.record.create.mq.event.send.fail");
      }
      return acceptRecord.getId();
  }
```

把"发送MQ消息"这个网络调用和 创建验收单记录 放在同一个事务里面，如果发送消息失败，DB操作自动回滚，保证2个操作的原子性。

再仔细分析一下，其实这个方案是错误的：

1. 想一想，如果消息中间件持久化成功了，但是返回时网络闪断。这时订单中心事务失败，但是结算中心继续消费消息，创建了新的应付记录。
2. 把网络调用放在DB事务里面，可能会因为网络的延时，导致DB长事务。使得大量的DB连接被持有而没有被释放掉，这个时候如果还有其他请求到来，很大可能因为获取不到数据库连接导致阻塞，降低了系统的吞吐量。

有什么方法可以确保消息一定投递成功呢，使用事务消息。值得一提的是 Apache RocketMQ 从4.3.0版本开始支持事务消息。

![IMAGE](02.jpg ':size=600x400')

参考：

[http://rocketmq.apache.org/release_notes/release-notes-4.3.0](http://rocketmq.apache.org/release_notes/release-notes-4.3.0)
[The Design Of Transactional Message](http://rocketmq.apache.org/rocketmq/the-design-of-transactional-message/)

## 事务消息

RocketMQ 的事务消息交互流程如下图所示：

![IMAGE](03.jpg ':size=600x400')

1. 发送方向 MQ 服务端发送消息。
2. MQ Server 将消息持久化成功之后，向发送方 ACK 确认消息已经发送成功，此时消息为半消息。
3. 发送方开始执行本地事务逻辑。
4. 发送方根据本地事务执行结果向 MQ Server 提交二次确认（Commit 或是 Rollback），MQ Server 收到 Commit 状态则将半消息标记为可投递，订阅方最终将收到该消息；MQ Server 收到 Rollback 状态则删除半消息，订阅方将不会接受该消息。
5. 在断网或者是应用重启的特殊情况下，上述步骤4提交的二次确认最终未到达 MQ Server，经过固定时间后 MQ Server 将对该消息发起消息回查。
6. 发送方收到消息回查后，需要检查对应消息的本地事务执行的最终结果。
7. 发送方根据检查得到的本地事务的最终状态再次提交二次确认，MQ Server 仍按照步骤4对半消息进行操作。
说明：事务消息发送对应步骤 1、2、3、4，事务消息回查对应步骤 5、6、7。

[代码示例](https://github.com/apache/rocketmq/tree/release-4.3.0/example/src/main/java/org/apache/rocketmq/example/transaction)

![IMAGE](04.jpg ':size=600x400')

![IMAGE](05.jpg ':size=600x400')

从示例中可以看到，生产者需要使用 TransactionMQProducer 对象来发送事务消息，TransactionMQProducer 继承自DefaultMQProducer ，所以生产者的配置和默认的生产者一样。此外，在发送消息前还会检查transactionListener属性，该类中的两个方法分别用于执行本地事务和回查本地事务的最终执行状态。

## 最终方案

将一个分布式事务拆成一个消息事务（A应用的本地操作+发消息）+B应用的本地操作。只要消息事务成功，那么A应用操作一定成功，消息也一定发出来了，这时候B应用收到消息去执行本地操作，如果B应用本地操作失败，消息件会被重投，直到B操作成功，这样就变相地实现了A与B的分布式事务。原理如下：

![IMAGE](06.jpg ':size=600x400')

伪代码如下(最终版本)：

```java
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.client.producer.LocalTransactionState;
import org.apache.rocketmq.client.producer.TransactionSendResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author 浪霄
 * @date 2018-11-24 11:09:15
 */
@Slf4j
@RestController
@RequestMapping("api/producer")
public class ProducerFronts {
    @Autowired
    private DefaultMQProducer producer;

    @GetMapping(value = "/test", produces = MediaType.APPLICATION_JSON_VALUE)
    public void test() {
        TestMQEvent event = new TestMQEvent("1");
        TransactionSendResult result = producer.sendMessageInTransaction(event.getTopic(), event.getTag(), event, new TransactionListenerImpl());
        // 根据状态判断本地方法是否执行成功
        if (LocalTransactionState.COMMIT_MESSAGE.equals(result.getLocalTransactionState())) {
            // 正常处理...
        } else {
            // 补偿逻辑...
        }
    }
}
```

```java
import org.apache.rocketmq.client.producer.LocalTransactionState;
import org.apache.rocketmq.client.producer.TransactionListener;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.common.message.MessageExt;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author 浪霄
 * @date 2018-11-20 17:55:00
 */
public class TransactionListenerImpl implements TransactionListener {

    /**
     * 执行本地事务
     * @param msg
     * @param arg
     * @return
     */
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            AcceptRecord record = null;
            List<AcceptSkuRecord> skuRecords = null;
            record.setOuterId(msg.getTransactionId());
            Response<Boolean> response = acceptRecordWriteService.creates(record, skuRecords);
            
            // 根据本地事务执行结果，返回状态对消息进行二次确认。
            if (response.isSuccess()) {
                return LocalTransactionState.COMMIT_MESSAGE;
            } else {
                return LocalTransactionState.ROLLBACK_MESSAGE;
            }
        } catch (Exception e) {
            return LocalTransactionState.UNKNOW;
        }
    }

    /**
     * 提供给broker进行回查本地事务消息
     * @param msg
     * @return
     */
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        System.out.println("服务器端回查事务消息： "+ msg.toString());
        try {
            // 通过 
            Response<AcceptRecord> response = acceptRecordReadService.findByOuterId(msg.getTransactionId());
            if (Objects.nonNull(AcceptRecord)) {
                return LocalTransactionState.COMMIT_MESSAGE;
            }
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }catch (Exception e) {
            return LocalTransactionState.UNKNOW;
        }
    }
}
```

**事务消息消费的方式，和普通消息消费方式一样。**

## 消费失败怎么办

消费失败有2种情况：
第一种是超时，中间件会重投消息，直到消费成功即可。
第二种是真的处理失败，当从事务最终失败的情况下，主事务已经提交，因此只能通过补偿实现逻辑上的回滚，而当前时间点距离主事务的提交已经有一定时间，回滚也可能失败。因此，最好是保证从事务逻辑上不会失败，万一失败了，记录日志，人工介入处理。

## 总结思考

- 在分布式领域，由于网络闪断、应用重启或者机器故障，经常需要重试，因此幂等性非常重要。
- 主从事务的业务逻辑，应该先占用资源，再消费资源。以结算核销为例，应该先扣减付款单的金额，再对应付单金额进行核销。
- 技术方案探索是为了解决一些业务痛点，让特定业务更爽。分布式事务的解决方案还有很多，如2PC、3PC、TCC等，需要根据业务场景选择合适的方案。
- To B的业务，链路上节点的成功率一般都是很高的，所有采用此方案是不错的选择。

