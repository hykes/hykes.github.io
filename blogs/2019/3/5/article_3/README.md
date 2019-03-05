# Spring统一异常处理

当前多数Web项目已经实现前后端分离，后端开发提供 restful api，前端发起请求获取响应结果。本文使用Spring框架自带的@RestControllerAdvice和@ExceptionHandler两个注解实现统一异常处理。

## 通用响应结构

```java
import lombok.ToString;
import java.io.Serializable;

/**
 * 统一响应结构体
 * @author hehaiyangwork@gmail.com
 * @date 2018/10/25
 */
@ToString
public class Response <T> implements Serializable {
    private static final long serialVersionUID = -750644833749014618L;

    /**
     * 请求是否成功
     */
    private boolean success;

    /**
     * 若 success = true, 则通过 result 可以获得调用结果
     */
    private T result;

    /**
     * 如果 success = false, 则通过 message 可以查看错误信息
     */
    private String message;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getResult() {
        return result;
    }

    public void setResult(T result) {
        this.success = true;
        this.result = result;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.success = false;
        this.message = message;
    }

    public static <T> Response<T> ok(T data) {
        Response<T> resp = new Response<>();
        resp.setResult(data);
        return resp;
    }

    public static <T> Response<T> ok() {
        return Response.ok(null);
    }

    public static <T> Response<T> fail(String message) {
        Response<T> resp = new Response<>();
        resp.setMessage(message);
        return resp;
    }
}
```

## 自定义异常封装

```java
public class JsonResponseException extends RuntimeException {
    private int status = 500;

    private String message = "unknown exception";

    public JsonResponseException() {
    }

    public JsonResponseException(String message) {
        this.message = message;
    }

    public JsonResponseException(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public JsonResponseException(int status, String message, Throwable cause) {
        super(message, cause);
        this.message = message;
        this.status = status;
    }

    public JsonResponseException(String message, Throwable cause) {
        super(message, cause);
        this.message = message;
    }

    public JsonResponseException(int status, Throwable cause) {
        super(cause);
        this.message = cause.getMessage();
        this.status = status;
    }

    public JsonResponseException(Throwable cause) {
        super(cause);
        this.message = cause.getMessage();
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

## 统一异常处理
```java
import com.google.common.base.Throwables;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletResponse;
import java.util.Locale;

/**
 * 统一异常处理
 * 实现国际化
 * @author hehaiyangwork@gmail.com
 * @date 2018/10/25
 */
@RestControllerAdvice
@Slf4j
public class JsonResponseExceptionHandler {

    private final MessageSource messageSource;

    public JsonResponseExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /**
     * Response 封装异常
     *
     * @param response
     * @param e
     * @return Response 对象
     */
    @ExceptionHandler(value = Exception.class)
    public Response<Object> defaultErrorHandler(HttpServletResponse response, Exception e) {
        log.error("un.expected.error:", e);
        //可以自定义拦截的异常
        if (e instanceof JsonResponseException) {
            response.setStatus(((JsonResponseException) e).getStatus());
            //国际化
            Locale locale = new Locale("zh", "CN");
            log.error("JsonResponseException happened, locale={}, cause={}", locale, Throwables.getStackTraceAsString(e));
            String message = messageSource.getMessage(e.getMessage(), null, e.getMessage(), locale);
            return Response.fail(message);
        }
        //异常统一返回500
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        return Response.fail("un.expected.error:" + ExceptionUtils.getMessage(e));
    }
}
```

## 使用示例
```java
    public Response<Object> test(){
        Object obj = null;
        // ...
        if (Objects.isNull(obj)) {
             /**
             * 代码里面出现异常不需要自己写 return Response.fail(...)
             * 直接抛出异常由拦截器统一处理
             */
            throw new JsonResponseException("object.not.found");
        }
        return Response.ok(obj);
    }
```

