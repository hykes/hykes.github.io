# 如何自定义spring-boot-starter

SpringBoot最大的特点就是提供了很多默认的配置，Spring4.x提供了基于条件来配置Bean的能力，SpringBoot就是通过这一原理来实现的。

在传统Maven项目中通常将一些层、组件拆分为模块来管理，以便相互依赖复用，在Spring Boot项目中我们则可以创建自定义Spring Boot Starter来达成该目的。

1.先创建一个maven项目，例如命名为handlebars-spring-boot-starter。这里说一下artifactId的命名问题，Spring 官方 Starter通常命名为spring-boot-starter-{name}，如spring-boot-starter-web，Spring官方建议非官方Starter命名应遵循{name}-spring-boot-starter的格式。

2.在创建的项目pom.xml中加入：

```xml
<!-- 引用依赖的父包 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>1.5.1.RELEASE</version>
</parent>
<!-- 依赖包 -->
<dependencies>
    <!-- spring boot 自动配置需要的包 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-autoconfigure</artifactId>
    </dependency>
    <!-- spring boot需要的包 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

或者：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-autoconfigure</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
        <dependency>
            <!-- Import dependency management from Spring Boot -->
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>1.5.2.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

3.我们今天要实现的功能，引入Handlebars.java模版引擎。添加相关依赖：

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <handlebars.version>4.0.5</handlebars.version>
</properties>

<dependency>
    <groupId>com.github.jknack</groupId>
    <artifactId>handlebars</artifactId>
    <version>${handlebars.version}</version>
</dependency>
```

4.添加属性配置类:

```java
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Desc: 属性配置类
 * Mail: hehaiyangwork@qq.com
 * Date: 2017/11/16
 */
@Data
@ConfigurationProperties(prefix="hbs")
public class HandlebarsProperties {

    private String root;

    private String prefix;

    @Value("${suffix:.hbs}")
    private String suffix;

}
```

使用@ConfigurationProperties注解来设置前缀。

5.添加自动配置类：

```java
import cn.hykes.boot.handlebars.HandlebarsView;
import cn.hykes.boot.handlebars.HandlebarsViewResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewResolverRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

/**
 * Desc: 自动配置类
 * Mail: hehaiyangwork@qq.com
 * Date: 2017/11/16
 */
@Configuration
@EnableConfigurationProperties(HandlebarsProperties.class)
@ConditionalOnProperty(prefix="hello",value="enabled",matchIfMissing=true)
public class HandlebarsAutoConfiguration extends WebMvcConfigurerAdapter {

    @Autowired
    private HandlebarsProperties handlebarsProperties;

    /**
     * 使用handlebars模版引擎
     * @param registry
     */
    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        HandlebarsViewResolver viewResolver = new HandlebarsViewResolver();
        viewResolver.setViewClass(HandlebarsView.class);
        viewResolver.setPrefix(handlebarsProperties.getPrefix());
        viewResolver.setSuffix(handlebarsProperties.getSuffix());
        viewResolver.setCache(false);
        registry.viewResolver(viewResolver);
    }

}
```

@Configuration：使用该注解来说明该类是配置类，等价于xml中的beans
@EnableConfigurationProperties(HandlebarsProperties.class):开启属性注入，对注解配置Bean的支持
@ConditionalOnProperty(prefix=hbs,value=”enabled”,matchIfMissing=true)：条件注解，指定的属性是否有指定的值。当设置hbs=enabled,如果没有设置则默认为true，即为条件符合。假如我们将matchIfMissing设置为false，则当设置hbs=enabled时，条件为false，则不会将该Bean加载进容器类，则无法使用handlebars模版引擎。

6.注册配置，在src/main/resource下新建META-INF/spring.factories文件：

```xml
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\cn.hykes.boot.HandlebarsAutoConfiguration
```

如果有多个自动配置类，可以用逗号隔开：

```xml
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\cn.hykes.boot.HandlebarsAutoConfiguration,\cn.hykes.boot.xxx
```

7.运行mvn:install打包安装，一个Spring Boot Starter便开发完成。

8.新建一个spring boot项目，在pom.xml文件中加入：

```xml
<dependency>
    <groupId>cn.hykes.boot</groupId>
    <artifactId>handlebars-spring-boot-starter</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
<dependency>
    <groupId>com.github.jknack</groupId>
    <artifactId>handlebars</artifactId>
    <version>4.0.5</version>
</dependency>
```

9.在该项目的的配置类中添加注解：

```java
@Import(HandlebarsAutoConfiguration.class)
```

10.在spring boot项目的application.yml文件中加入：

```yml
#hbs
hbs:
  root: /Users/hykes/GitHub/spring-boot-examples/src/main/resources/statics
  prefix: ${hbs.root}
  suffix: .hbs
```

11.在resources文件夹中，新建statics文件夹，创建模版文件index.hbs:

```html
<html>
<head>
    <title>test</title>
</head>
<body>
 now time : {{time}}
</body>
</html>
```

12.在controller类中，添加：

```java
@RequestMapping(value = "/index", method = RequestMethod.GET)
public ModelAndView index(ModelMap model){
    model.addAttribute("time", new Date());
    return new ModelAndView("index", model);
}
```

13.至此，访问路径，可以发现模版引擎生效。

14.项目源码

starter项目
```
git clone git@github.com:hykes/handlebars-spring-boot-starter.git
```

案例项目
```
git clone -b feature/handlebars-spring-boot-starter-examples) git@github.com:hykes/spring-boot-examples.git
```

!> 本文基于 [知识共享署名-相同方式共享 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh) 国际许可协议发布，欢迎转载，演绎或用于商业目的，但是必须保留本文的署名及链接。



