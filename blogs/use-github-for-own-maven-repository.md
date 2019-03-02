# 巧用GitHub做为个人Maven仓库

编程的时候通常会写一些工具类，如果想要让其他人也能引用，就必须上传到中央仓库或者私有仓库中。但是上传到中央仓库步骤比较繁琐，而发布到私有仓库就必须先在服务器中搭建私服。

有没有其他方便的方法呢？有，可以使用GitHub做为个人的maven仓库。

1.首先在GitHub上新建一个repository，例如命名为maven-repo，用来当做Maven仓库。

2.在本地创建文件夹maven-repo，用于存放mvn deploy生成的文件（例如jar、pom、md5、sha1等各种文件）。

3.在项目的pom.xml文件中加入：

```xml
<distributionManagement>
    <repository>
       <id>maven-repo</id>
       <name>release repository</name>
       <url>file:///Users/hykes/GitHub/maven-repo</url>
    </repository>
    <!--<snapshotRepository>-->
       <!--<id>maven-snapshots</id>-->
       <!--<name>snapshot repository</name>-->
       <!--<url>file:///Users/hehaiyang/GitHub/maven-snapshots</url>-->
    <!--</snapshotRepository>-->
</distributionManagement>
```

如果想区分REALASE和SNAPSHOT，可以打开注释。

4.运行mvn deploy命令，会在/Users/hykes/GitHub/maven-repo目录下生成一个所需要上传到仓库的文件。

5.将本机中的文件上传到GitHub，执行git操作：

```shell
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/hykes/maven-repo.git
git push -u origin master
```

6.推送以后，可以在GitHub看到提交的文件。

7.GitHub项目对应的文件HTTP下载URL根目录是：

```
https://raw.githubusercontent.com/hykes/maven-repo/master/
```

路径是用户名+GitHub仓库名+分支。

8.其他人可以在其maven项目的pom.xml中加入：

```xml
<dependencies>
   <dependency>
       <groupId>cn.hykes</groupId>
       <artifactId>项目</artifactId>
       <version>版本号</version>
   </dependency>
</dependencies>

<repositories>
   <repository>
       <id>maven-repo</id>
       <url>https://raw.githubusercontent.com/hykes/maven-repo/master</url>
   </repository>
</repositories>
```

9.至此，其他人可以成功使用maven下载我们提供的jar包。

---

第二种方法，**推荐**

1. 创建mvn-repo分支

首先在你的github上创建一个maven-repo仓库

2. 配置本地mvn服务

找到自己计算机中本地maven配置文件settings.xml,找到其中的 servers 标签，加入如下配置：

```xml
<server>
    <id>github</id>
    <username>github的用户名</username>
    <password>github的密码</password>
</server>
```

3. 修改pom文件发布本地仓库

在需要发布的项目中的pom文件里的 plugins 标签下加入以下插件：

```xml
<plugin>
    <artifactId>maven-deploy-plugin</artifactId>
    <version>2.8.1</version>
    <configuration>
    <altDeploymentRepository>internal.repo::default::file://${project.build.directory}/mvn-repo</altDeploymentRepository>
    </configuration>
</plugin>
```

然后运行 mvn clean deploy 命令，即可在对应项目中的target/mvn-repo目录下找到本地的jar

4. 继续修改pom文件发布到远程github上

修改pom文件，添加属性：

```xml
<properties>
     <github.global.server>github</github.global.server>
</properties>
```

添加修改插件：

[插件地址](https://github.com/github/maven-plugins)

```xml
<plugin>
  <groupId>com.github.github</groupId>  
  <artifactId>site-maven-plugin</artifactId>  
  <version>0.12</version>  
  <configuration>
    <message>Maven artifacts for ${project.version}</message>  
    <noJekyll>true</noJekyll>  
    <outputDirectory>${project.build.directory}/mvn-repo</outputDirectory>  
    <branch>refs/heads/master</branch>  
    <includes>
      <include>**/*</include>
    </includes>  
    <repositoryName>maven-repo</repositoryName>  
    <!-- 对应github上创建的仓库名称 name -->  
    <repositoryOwner>你的用户名</repositoryOwner>  
    <!-- github 仓库所有者 -->
  </configuration>  
  <executions>
    <execution>
      <goals>
        <goal>site</goal>
      </goals>  
      <phase>deploy</phase>
    </execution>
  </executions>
</plugin>
```

再次执行 mvn clean deploy命令即可发布到github上了

5. 在自己的项目中使用发布的jar

pom文件中添加对应仓库：

```xml
<repositories>
    <repository>
        <id>maven-repo-master</id>
        <url>https://raw.github.com/hykes/maven-repo/master/</url>
        <snapshots>
            <enabled>true</enabled>
            <updatePolicy>always</updatePolicy>
        </snapshots>
    </repository>
</repositories>
```

然后添加依赖即可使用，如：

```xml
<dependency>
    <groupId>com.github.hykes</groupId>
    <artifactId>ws-client</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
```

!> 本文基于 [知识共享署名-相同方式共享 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh) 国际许可协议发布，欢迎转载，演绎或用于商业目的，但是必须保留本文的署名及链接。
