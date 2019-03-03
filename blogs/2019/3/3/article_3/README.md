# 站内信系统设计

站内信即是系统内的消息，与电子邮件通过专门的邮件服务器发送、保存不同，站内信是通过数据库插入记录来实现的。站内信有两个基本功能：

- 点到点的消息传送
  > 用户给用户发送站内信，管理员给用户发送站内信。
- 点到面的消息传送
  > 管理员给用户（指定满足某一条件的用户群）群发消息。

点到点的消息传送很容易实现，不再详述。本文主要根据不同的情况，说一说群发功能是如何实现的。

## 站内用户数为少量级别（几十到上百）

这种情况由于用户的数量非常少，没有必要过多的考虑数据库的优化，采用简单的系统设计即可，后期也比较容易维护，是典型的用空间换时间的做法。

数据库的设计如下：

```sql
CREATE TABLE `t_message` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '编号',
  `send_id` bigint(20) NOT NULL COMMENT '发送者编号',
  `receive_id` bigint(20) NOT NULL COMMENT '接受者编号（如为0，则接受者为所有人）',
  `content` varchar(1024) NOT NULL COMMENT '站内信内容',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '站内信的查看状态',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) COMMENT='站内信';
```

若某一个管理员要给所有人发站内信，则先遍历用户表，再按照用户表中的所有用户依次将站内信插入到Message表中。如果有50个用户，则群发一条站内信要执行50个插入操作。这个理解上比较简单，比较耗损空间。

某一个用户登陆后，查看站内信的语句则为：

```sql
Select * FROM t_message Where receive_id='用户ID' receive_id=0
```

## 站内用户数为中量级别（上千到上万）。

如果按照第一种情况的思路。那么发一条站内信的后果，后台将插入上千上万条记录，同时 t_message 表中 content 字段的内容是一样的，而 content 又可能大量的占用存储空间。即使 content 字段只有有100个汉字，占用 200个字节，那么5万条，就占用将近10M空间。

因此，将原先的表格拆分为两个表，将Message的主体放在一个表内，节省空间的占用。

数据库的设计如下：

```sql
CREATE TABLE `t_message` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '编号',
  `send_id` bigint(20) NOT NULL COMMENT '发送者编号',
  `receive_id` bigint(20) NOT NULL COMMENT '接受者编号（如为0，则接受者为所有人）',
  `message_id` bigint(20) NOT NULL COMMENT '站内信编号',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '站内信的查看状态',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) COMMENT='站内信';
```

```sql
CREATE TABLE `t_message_content` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '编号',
  `content` varchar(1024) NOT NULL COMMENT '站内信内容',
  `created_at` datetime NOT NULL COMMENT '发送时间',
  `updated_at` datetime NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) COMMENT='站内信';
```

管理员发送站内信时，执行两步操作。先在 t_message_content 表中，插入站内信的内容。然后在 t_message  表中给所有的用户插入一条记录，标识有一封站内信。这样的设计，将重复的站内信的主体信息（站内信的内容，发送时间）放在一个表内，大量的节省存储空间。但是在查询的时候，要比第一种情况来的复杂。

## 站内用户为大量级的（上百万），并且活跃的用户只占其中的一部分。

假定现在网站内注册用户2百万，其中活跃用户只占其中的10%。按照第二种的情况，发一封站内信，那得执行2百万次插入操作。但是其中的有效操作只有10%，因为另外的90%的用户可能永远都不会再登录了。

在这种情况下，我们还得把思路换换。数据库的设计和第二种情况一样，但是在管理员发站内信的时候，只在 t_message_content 表插入站内信的主体内容，t_message 表里不插入记录。

当用户在登录以后，首先查询 t_message_content 表中的那些没有在 t_message 表中有记录的记录，表示是未读的站内信。在查阅站内信的内容时，再将相关的记录插入到 t_message 表中。

这个方法和第二种的比较起来。如果，活跃用户是100%。两者效率是一样的。而活跃用户的比例越低，越能体现第三种方式的优越性。只插入有效的记录，那些不活跃的，就不再占用空间了。