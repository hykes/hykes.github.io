# Mybatis中的${}和#{}的区别

## #{}

标识一个占位符，向占位符输入参数，mybatis自动进行java类型和jdbc类型的转换，程序员不需要考虑参数的类型，比如传入字符串，mybatis最终拼接好的sql就是参数两边加单引号

## ${}

标识sql的拼接，通过${}接收参数，将参数的内容不加任何修饰拼接在sql中。

## 区别

```sql
select * from user where name = 'zhangsan'; 
 
select * from user where name = #{name}; 

select * from user where name = '${name}'; 
```

一般情况下，我们都不会注意到这里面有什么不一样的地方。因为这些sql都可以达到我们的目的，去查询名字叫zhangsan的用户。


动态 SQL 是 mybatis 的强大特性之一，也是它优于其他 ORM 框架的一个重要原因。mybatis 在对 sql 语句进行预编译之前，会对 sql 进行动态解析，解析为一个 BoundSql 对象，也是在此处对动态 SQL 进行处理的。在动态 SQL 解析阶段，#{}和${}会有不同的表现

```sql
select * from user where name = #{name}; 
```

在动态解析的时候，#{}会解析成一个参数标记符。就是解析之后的语句是：

```sql
select * from user where name = ？; 
``` 

而使用${}的时候

```sql
select * from user where name = '${name}'; 
```

${}会将我们传入的参数当做String字符串填充到我们的语句中，就会变成下面的语句

```sql
select * from user where name = 'zhangsan'; 
```

预编译之前的 SQL 语句已经不包含变量了，完全已经是常量数据了。相当于我们普通没有变量的sql了。

综上所得，${}变量的替换阶段是在动态 SQL 解析阶段，而#{}变量的替换是在 DBMS 中。

此外，#方式能够很大程度防止sql注入,而$方式无法防止Sql注入，所以建议一般能用#的就别用$。

