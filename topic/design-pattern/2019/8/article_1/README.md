
## 责任链（Chain of Responsibility）模式的定义

为了避免请求发送者与多个请求处理者耦合在一起，将所有请求的处理者通过前一对象记住其下一个对象的引用而连成一条链；当有请求发生时，可将请求沿着这条链传递，直到有对象处理它为止。

创建多个对象，使这些对象形成一条链，并沿着这条链传递请求，直到链上的某一个对象决定处理此请求。

## 模式的结构

![IMAGE](/82CBDA06944E91CC1E0C09AEAE6AE814.jpg 'size=615x340')

职责链模式主要包含以下角色：
- 抽象处理者（Handler）角色：定义了处理请求的接口或者抽象类，提供了处理请求的的方法和设置下一个处理者的方法。
- 具体处理者（Concrete Handler）角色：实现抽象处理者的处理方法，判断能否处理本次请求，如果可以处理请求则处理，否则将该请求转给它的后继者。
- 客户类（Client）角色：创建处理链，并向链头的具体处理者对象提交请求，它不关心处理细节和请求的传递过程。

特点：
1）接收请求的对象连接成一条链，对象之间存在层级关系。
2）这些对象可处理请求，也可传递请求，直到有对象处理该请求。

## 基本实现

```java
/**
 * 抽象处理器
 */
public abstract class Handler {
    //下一个处理器
    private Handler nextHandler;

    //处理方法
    public abstract void handleRequest();

    public Handler getNextHandler() {
        return nextHandler;
    }
    public void setNextHandler(Handler nextHandler) {
        this.nextHandler = nextHandler;
    }
}

/**
 * 具体处理器.
 */
public class ConcreteHandler extends Handler {

    @Override
    public void handleRequest() {
        System.out.println(this.toString()+"处理器处理");
        if (getNextHandler()!=null){   //判断是否存在下一个处理器
            getNextHandler().handleRequest();   //存在则调用下一个处理器
        }
    }

}

/**
 * 测试
 */
public class Client {
    public static void main(String[] args) {
        Handler h1 = new ConcreteHandler();
        Handler h2 = new ConcreteHandler();
        h1.setNextHandler(h2);   //h1的下一个处理器是h2
        h1.handleRequest();
    }
}
```

## 优缺点

优点
1）降低耦合度：客户端不需要知道请求由哪个处理者处理，而处理者也不需要知道处理者之间的传递关系，由系统灵活的组织和分配。
2）良好的扩展性：增加处理者的实现很简单，只需重写处理请求业务逻辑的方法。

缺点
1）降低程序的性能。每个请求都是从链头遍历到链尾，当链比较长的时候，性能会大幅下降。
2）请求递归，不易调试。

## 应用场景

责任链模式是一种常见的模式，其典型的应用场景如下：
- 一个请求需要处理一系列的工作。
- 业务流的处理，例如流程审批。
- 对系统进行扩展补充。

## 优化

基本实现中，每个处理器都需要设置下次处理器，优化实现如下：

```java
/**
 * 处理器接口
 */
public interface BaseHandle {

    /**
     * 所有 case 处理逻辑的方法
     * @param input
     * @param chain
     */
    void doSomething(String input, BaseHandle chain);
}

/**
 * 处理器实现1
 */
public class OneHandle implements BaseHandle {

    @Override
    public void doSomething(String input, BaseHandle chain) {
        System.out.println("handle 1....");
        if ("1".equals(input)) {
            System.out.println(getClass().getName());
            return;
        }
        // 当前没法处理，回调回去，让下一个去处理
        chain.doSomething(input, chain);
    }
}

/**
 * 处理器实现2
 */
public class TwoHandle implements BaseHandle {
    @Override
    public void doSomething(String input, BaseHandle chain) {
        System.out.println("handle 2....");
        if ("2".equals(input)) {
            System.out.println(getClass().getName());
            return;
        }
        // 当前没法处理，回调回去，让下一个去处理
        chain.doSomething(input, chain);
    }
}

/**
 * 责任链管理类
 */
public class HandleChain implements BaseHandle {

    /**
     * 所有 case 列表
     */
    private List<BaseHandle> handles = new ArrayList<>();

    /**
     * 索引，用于遍历所有 case 列表
     */
    private int index = 0;

    /**
     * 添加 case
     * @param baseCase
     * @return
     */
    public HandleChain addBaseCase(BaseHandle baseCase) {
        handles.add(baseCase);
        return this;
    }

    @Override
    public void doSomething(String input, BaseHandle chain) {
        // 所有遍历完了，直接返回
        if (index == handles.size()) {
            return;
        }
        // 获取当前 case
        BaseHandle currentCase = handles.get(index);
        // 修改索引值，以便下次回调获取下个节点，达到遍历效果
        index++;
        // 调用 当前 case 处理方法
        currentCase.doSomething(input, this);
    }
}

/**
 * 测试
 */
public class Client {

    public static void main(String[] args) {
        String input = "2";
        HandleChain caseChain = new HandleChain();
        caseChain.addBaseCase(new OneHandle())
                .addBaseCase(new TwoHandle());
        caseChain.doSomething(input, caseChain);
    }
}
```


## 参考
[责任链模式的思考](https://mrdear.cn/2018/03/20/experience/design_patterns--chain_of_responsibility/)

[实际项目中运用责任链模式](http://ifeve.com/%E5%AE%9E%E9%99%85%E9%A1%B9%E7%9B%AE%E4%B8%AD%E8%BF%90%E7%94%A8%E8%B4%A3%E4%BB%BB%E9%93%BE%E6%A8%A1%E5%BC%8F/)

[责任链模式详解](http://c.biancheng.net/view/1383.html)