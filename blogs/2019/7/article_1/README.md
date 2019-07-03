# MySQL中使用explain查看执行计划

MySQL 提供了一个 EXPLAIN 命令,它可以对 SELECT 语句进行分析，获取优化器对当前查询的执行计划，以供开发人员针对相关 SQL 进行优化。在 SELECT 语句前加上 Explain 就可以查看到相关信息, 例如:

![explain](1.jpg ':size=874x152')

## 特点

- explain 返回的结果是以表为粒度的，每个表输出一行，这里的表示广义上的表，可以是一个子查询，也可以是一个 UNION 后的结果。
并不是所有的 explain 都不执行查询，如果 FROM 子句里包含了子查询，那么 MySql 实际上会执行子查询以外层对于外层查询的优化。
- explain 无法告诉我们触发器，存储过程以及 UDF 是如何影响查询的
- explain 对于内存排序和临时文件排序都使用 “filesort”
- explain 对于磁盘上的临时表和内存上的临时表都使用 “Using temporary”
- explain 只能解析 Select 查询，对于 update，insert 等都不支持，我们可以使用 select 来模拟 update 操作近似获取 update 的执行过程

## 字段描述

### id
查询语句的序号或者说是标识符，每个查询语句包括子查询都会分配一个id,表示查询中执行select子句或者操作表的顺序。
可能有如下几种情况：

| - | 描述 | 
| :--- | :--- | 
| id值相同 | id 值相同一般出现在多表关联的场景，访问表的顺序是从上到下。  |
| id值不同 | id 值不同的情况，表示任务被执行的顺序,序号越大的任务越先执行。 |
| id包含了相同和不同的情况 |  |

### select_type

常见的有如下6种:SIMPLE、PRIMARY、SUBQUERY、DERIVED、UNION、UNION RESULT，主要是告诉我们查询的类型是普通查询、联合查询、子查询等复杂的查询。

| ID | select_type | description |
| :--- | :--- | :--- |
| 1 | SIMPLE  | 不包含任何子查询或union等查询 |
| 2 | PRIMARY  | 包含子查询最外层查询就显示为 PRIMARY |
| 3 | SUBQUERY  | 在select或 where字句中包含的查询 |
| 4 | DERIVED  | from字句中包含的查询 |
| 5 | UNION  | 出现在union后的查询语句中 |
| 6 | UNION RESULT  | 从UNION中获取结果集，例如上文的第三个例子 |

### table

查询的数据表，当从衍生表中查数据时会显示 x 表示对应的执行计划id。

### partitions

表的分区字段,没有分区的话则为null.

### type

这条查询语句访问数据的类型,从最好到最差的结果依次如下:

system > const > eq_ref > ref > range > index > ALL

所有可取值的范围:
| - | 描述 | 
| :--- | :--- | 
| ALL | 扫描全表数据，当执行计划出现type 为all 时，我们尽量通过修改索引的方式让查询利用索引。  |
| index | 表示全索引扫描(full index scan)， 和 ALL 类型类似，只不过 ALL 类型是全表扫描, 而 index 类型则是扫描所有的索引记录, 而不扫描数据。index 类型通常会出现在覆盖索引中,所要查询的数据直接在索引中就可以访问， 而不用回表扫描数据. 此时Extra 字段 会显示 Using index。还有一种是全表扫描时通过索引顺序访问数据。此时并不会在Extra提示 using index。  |
| range | 表示where条件使用索引范围查询, 通过索引字段范围获取表中部分数据记录. 这个类型通常出现在 <>, >, >=, <, <=, IS NULL, <=>, BETWEEN, IN() 操作中.当 type 是 range 时,ref 字段为 NULL。  |
| ref | 此类型通常出现在sql使用非唯一或非主键索引，或者是使用最左前缀规则索引的查询。非唯一性索引扫描，返回匹配某个单独值的所有行。常见于使用非唯一索引即唯一索引的非唯一前缀进行的查找。  |
| eq_ref | 该类型多出现在多表join场景，通过主键或者唯一键访问表。唯一性索引扫描，对于每个索引键，表中只有一条记录与之匹配。常见于主键或唯一索引扫描。  |
| const | 表示通过主键或者唯一键键查找数据时只匹配最多一行数据。const,system 当MySQL对查询某部分进行优化，并转换为一个常量时，使用这些类型访问。NULL：MySQL在优化过程中分解语句，执行时甚至不用访问表或索引。  |
| system | 表示结果集仅有一行。这是const联接类型的一个特例，表须是myisam或者memory存储引擎。如果是innodb存储引擎，type 显示为 const 。  |

### possible_keys

这次查询可能使用的索引,但是不一定是真正使用的索引.
possible_keys 表示 MySQL 在查询时， 能够使用到的索引. 注意， 即使有些索引在 possible_keys 中出现，但是并不表示此索引会真正地被 MySQL 使用到. MySQL 在查询时具体使用了哪些索引, 由 key 字段决定。

### key

查询真正使用的索引,若没有使用索引，显示为NULL.

### key_len
使用索引的长度,在使用联合索引的时候可以根据这一列来推算使用了哪些最左前缀索引.
计算方式:

- 所有字段如果没有设置为not null,则需要加一个字节.
- 定长字段占用实际的字节长度,比如:int占用4个字节,datatime占用4个字节.
- 变长字段占用多占用两个字节,比如varchar(20)将会占用20*4+2 = 82个字节.
- 不同的字符集占用字节不一样,上面举例是使用的utf8mb4字符集.

### ref

表示上述表的连接匹配条件，即哪些列或常量被用于查找索引列上的值

### rows

rows 也是一个重要的字段。 MySQL 查询优化器根据统计信息，估算 SQL 要查找到结果集需要扫描读取的数据行数。原则上 rows 越少越好。记住这个并非是完全准确的值。

### extra

包含一些其他信息,常见的有以下几种:
| - | 描述 | 
| :--- | :--- | 
| Using index | 表示相应的select操作中使用了覆盖索引（Covering Index） |
| Using where | 表示拿到记录后进行“后过滤”（Post-filter）,如果查询未能使用索引，Using where的作用只是提醒我们MySQL将用where子句来过滤结果集。 |
| Using temporary | 表示mysql在这个查询语句中使用了临时表。 |
| Using filesort | 表示使用了文件排序,即查询中的排序无法通过索引来完成。 |

## 参考资料

[mysql 官方文档](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html#explain-extra-information)

[数据库样本](https://dev.mysql.com/doc/index-other.html)


