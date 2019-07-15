## 什么是单例

单例(Singleton)应该是开发者们最熟悉的设计模式，维基百科对单例的定义是单例对象的类必须保证只有一个实例存在。对单例的实现可以分为两大类——懒汉式和饿汉式，他们的区别在于：

- 懒汉式：指全局的单例实例在第一次被使用时构建。
- 饿汉式：指全局的单例实例在类装载时构建。

单例模式具备的典型特点：
- 只允许一个实例存在且自我实例化。
- 只允许一个公共访问点（必须是静态方法，通常使用getInstance这个名称）。

## 懒汉模式

### 懒汉式版本1（线程不安全，不可用）

```java
public class SingletonDemo {

    private static SingletonDemo instance;
    
    // 把构造器改为私有的，这样能够防止直接new一个实例。
    private SingletonDemo() {}

    public static SingletonDemo getInstance() {
        if (instance == null) {
          instance = new SingletonDemo();
        }
        return instance;
    }
}
```

> 思考：
在多线程情景下，如果有多个线程同时到达if (instance == null)，都判断为null，那么每个线程都会会创建一个实例，这样就不是单例了。

既然在多线程下存在问题，那么加上一个同步锁来防止问题发生。

### 懒汉式版本2（线程安全，同步方法，不推荐使用）

```java
public class SingletonDemo {

    private static SingletonDemo instance;

    private SingletonDemo() {}

    public static synchronized SingletonDemo getInstance() {
        if (instance == null) {
          instance = new SingletonDemo();
        }
        return instance;
    }

}
```

当 getInstance 方法加上 synchronized 关键字之后，如果有两个线程（T1、T2）同时执行到这个方法时，会有其中一个线程T1获得同步锁，得以继续执行，而另一个线程T2则需要等待，当第T1执行完毕 getInstance 之后（完成了null判断、对象创建、获得返回值之后），T2线程才会执行执行。避免了版本1中因为多线程导致多个实例的情况。

> 思考：
给 gitInstance 方法加锁，虽然会避免了多线程情景下出现多个实例的情况，但是会强制除T1之外的所有线程等待，实际上会对程序的执行效率造成负面影响。

### 双重检查(Double-Check) (推荐版本)

```java
public class SingletonDemo {
    // 了解为什么使用 volatile 关键字
    private static volatile SingletonDemo instance;

    private SingletonDemo() {}

    public static synchronized SingletonDemo getInstance() {
        if (instance == null) {
            synchronized (SingletonDemo.class) {
                if (instance == null) {
                    instance = new SingletonDemo();
                }
            }
        }
        return instance;
    }
}
```

双重检验锁模式（double checked locking pattern），是一种使用同步块加锁的方法。一般称其为双重检查锁，因为会有两次检查 instance == null，一次是在同步块外，一次是在同步块内。

## 饿汉模式

由于类装载的过程是由类加载器（ClassLoader）来执行的，这个过程也是由JVM来保证同步的，所以这种方式先天就有一个优势——能够免疫许多由多线程引起的问题。

### 静态常量

```java
public class SingletonDemo {

    private final static SingletonDemo instance = new SingletonDemo();

    private SingletonDemo() {}

    public static SingletonDemo getInstance() {
        return instance;
    }
}
```

该写法的缺点也就是饿汉式单例本身的缺点：由于INSTANCE的初始化是在类加载时进行的，而类的加载是由ClassLoader来做的，所以开发者本来对于它初始化的时机就很难去准确把握：
- 可能由于初始化的太早，造成资源的浪费。
- 如果初始化本身依赖于一些其他数据，那么也就很难保证其他数据会在它初始化之前准备好。

### 静态代码块

```java
public class SingletonDemo {

    private static final SingletonDemo instance;

    static {
        instance = new SingletonDemo();
    }

    private SingletonDemo() {}

    public static SingletonDemo getInstance() {
        return instance;
    }
}
```

## 其他实现

###  静态内部类 (推荐使用)
```java
/**
 * Effective Java 第一版推荐写法
 */
public class SingletonDemo {

    private static class SingletonHolder {
        private static final SingletonDemo INSTANCE = new SingletonDemo();
    }
    private SingletonDemo () {}

    public static final SingletonDemo getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

这种写法非常巧妙：

对于内部类SingletonHolder，它是一个饿汉式的单例实现，在SingletonHolder初始化的时候会由ClassLoader来保证同步，使INSTANCE是一个真·单例。
同时，由于SingletonHolder是一个内部类，只在外部类的Singleton的getInstance()中被使用，所以它被加载的时机也就是在getInstance()方法第一次被调用的时候。
——它利用了ClassLoader来保证了同步，同时又能让开发者控制类加载的时机。从内部看是一个饿汉式的单例，但是从外部看来，又的确是懒汉式的实现。

### 枚举

```java
/**
 * Effective Java 第二版推荐写法
 */
public enum SingletonDemo {
    INSTANCE;
    public void getInstance() { 
        // do something
    }
}

// 使用
SingletonDemo.INSTANCE.getInstance();
```

