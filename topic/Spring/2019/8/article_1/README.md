# Spring AOP

AOP为Aspect Oriented Programming的缩写，意为：面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。利用AOP可以对业务逻辑的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高了开发的效率。

## AOP的相关术语

### 切面（Aspect）
切面是通知和切点的结合，定义了何时、何地应用通知功能。

### 切点（Pointcut）
切点定义了通知功能被应用的范围。比如日志切面的应用范围就是所有接口，即所有controller层的接口方法。

#### 切点表达式
指定了通知被应用的范围，表达式格式：

```
execution(方法修饰符 返回类型 方法所属的包.类名.方法名称(方法参数)
//com.github.hykes.controller包中所有类的public方法都应用切面里的通知
execution(public * com.github.hykes.controller.*.*(..))
//com.github.hykes.service包及其子包下所有类中的所有方法都应用切面里的通知
execution(* com.github.hykes.service..*.*(..))
//com.github.hykes.service.PmsBrandService类中的所有方法都应用切面里的通知
execution(* com.github.hykes.service.PmsBrandService.*(..))
```

### 通知（Advice）
通知描述了切面要完成的工作以及何时执行。比如我们的日志切面需要记录每个接口调用时长，就需要在接口调用前后分别记录当前时间，再取差值。

- 前置通知（Before）：在目标方法调用前调用通知功能；
- 后置通知（After）：在目标方法调用之后调用通知功能，不关心方法的返回结果；
- 返回通知（AfterReturning）：在目标方法成功执行之后调用通知功能；
- 异常通知（AfterThrowing）：在目标方法抛出异常后调用通知功能；
- 环绕通知（Around）：通知包裹了目标方法，在目标方法调用之前和之后执行自定义的行为。

### 连接点（JoinPoint）
通知功能被应用的时机。比如接口方法被调用的时候就是日志切面的连接点。

### 引入（Introduction）
在无需修改现有类的情况下，向现有的类添加新方法或属性。

### 织入（Weaving）
把切面应用到目标对象并创建新的代理对象的过程。

## Spring中使用注解创建切面

### 相关注解

- @Aspect：用于定义切面
- @Before：通知方法会在目标方法调用之前执行
- @After：通知方法会在目标方法返回或抛出异常后执行
- @AfterReturning：通知方法会在目标方法返回后执行
- @AfterThrowing：通知方法会在目标方法抛出异常后执行
- @Around：通知方法会将目标方法封装起来
- @Pointcut：定义切点表达式

### 添加AOP切面实现接口日志记录

```java
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.Signature;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;

/**
 * @author hykes
 * @date 2019-08-06 20:50:00
 */
@Slf4j
@Aspect
@Component
@Order(1)
public class WebLogAspect {

    @Pointcut("execution(public * com.github.hykes.controller.*.*(..))")
    public void webLog() {
    }

    @Before("webLog()")
    public void doBefore(JoinPoint joinPoint) {
        //获取当前请求对象
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes.getRequest();
        Signature signature = joinPoint.getSignature();
        MethodSignature methodSignature = (MethodSignature) signature;

        //打印请求的内容
        log.info("接口路径:{}" , request.getRequestURL().toString());
        log.info("IP:{}" , request.getRemoteAddr());
        log.info("请求类型:{}", request.getMethod());
        log.info("类方法:{}.{}", methodSignature.getDeclaringTypeName(), methodSignature.getName());
        log.info("请求参数:{} ", Arrays.toString(joinPoint.getArgs()));
    }
}
```