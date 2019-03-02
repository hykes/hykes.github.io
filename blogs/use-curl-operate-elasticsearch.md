# 使用CURL命令操作ES

### CURL命令

简单认为是可以在命令行下访问url的一个工具
curl是利用URL语法在命令行方式下工作的开源文件传输工具，使用curl可以简单实现常见的get/post请求。

```
curl
-X 指定http请求的方法
HEAD GET POST PUT DELETE
-d 指定要传输的数据
比如：curl -XHEAD 'https://www.baidu.com'
```

------
### 创建一个新的索引
```
curl -XPUT "http://localhost:9200/elasticsearch-samples"
```
索引库名称必须要全部小写，不能以下划线开头，也不能包含逗号

------
### 添加一条文档

```
type: users
document: 1

curl -XPUT "http://localhost:9200/elasticsearch-samples/users/1" -d '{            
    "name":"hykes",
    "age": 24，
    "major": [ "sports", "music" ]
    }'

curl -XPOST "http://localhost:9200/elasticsearch-samples/users/2" -d '{
    "name":"chris",
    "age":"25"
    }'
```

如果没有明确指定索引数据的ID，那么es会自动生成一个随机的ID,需要使用POST参数

```
curl -XPOST http://localhost:9200/elasticsearch-samples/users/ -d '{"name":"hhy","age": 24}'
```

如果想要确定我们创建的都是全新的内容
1：使用自增ID
2：在url后面添加参数

```
curl -XPUT http://localhost:9200/elasticsearch-samples/users/2?op_type=create -d '{"name":"hhy","age":24}'
curl -XPUT http://localhost:9200/elasticsearch-samples/users/2/_create -d '{"name":"hhy","age": 24}'
```

如果成功创建了新的文档，Elasticsearch将会返回常见的元数据以及201 Created的HTTP反馈码。
如果存在同名文件，Elasticsearch将会返回一个409 Conflict的HTTP反馈码

------
### GET查询索引
根据员工id查询

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/2
```

在任意的查询字符串中添加pretty参数，es可以得到易于识别的json结果。

curl后添加-i 参数，这样就能得到反馈头文件

```
curl -i 'http://localhost:9200/elasticsearch-samples/users/1?pretty'
```

检索文档中的一部分，如果只需要显示指定字段，

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/1?_source=name
```

如果只需要source的数据

```
curl –XGET http://localhost:9200/elasticsearch-samples/users/1/_source
```

查询所有

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/_search
```

可以在返回的hits 中发现已经录入的文档。搜索会默认返回最前的10个数值。

根据条件进行查询

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/_search?q=age:24
```

------
### DSL查询

Domain Specific Language
领域特定语言

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/_search -d '{"query":{"match":{"age":"24"}}}'
```

------
### MGET查询
使用mget API获取多个文档

```
curl -XGET http://localhost:9200/_mget?pretty -d '{"docs":[{"_index":“hello","_type":"emp","_id":2,"_source":"name"},{"_index":"website","_type":"blog","_id":2}]}'

如果你需要的文档在同一个_index或者同一个_type中，你就可以在URL中指定一个默认的/_index或者/_index/_type
curl -XGET http://localhost:9200/hello/emp/_mget?pretty -d '{"docs":[{"_id":1},{"_type":"blog","_id":2}]}'

如果所有的文档拥有相同的_index 以及_type，直接在请求中添加ids的数组即可。
curl -XGET http://localhost:9200/hello/emp/_mget?pretty -d '{"ids":["1","2"]}'

注意：如果请求的某一个文档不存在，不会影响其他文档的获取结果。HTTP返回状态码依然是200，这是因为mget这个请求本身已经成功完成。要确定独立的文档是否被成功找到，需要检查found标识。
```

------
### HEAD使用
如果只想检查一下文档是否存在，你可以使用HEAD来替代GET方法，这样就只会返回HTTP头文件

```
curl -i -XHEAD http://localhost:9200/elasticsearch-samples/users/1
```

------
### 更新

ES可以使用PUT或者POST对文档进行更新，如果指定ID的文档已经存在，则执行更新操作

```
curl -XPUT http://localhost:9200/elasticsearch-samples/users/1 -d '{"doc":{"name":"hykes","age":"24"}}'
```

局部更新，可以添加新字段或者更新已有字段（必须使用POST）

```
curl -XPOST http://localhost:9200/elasticsearch-samples/users/1/_update -d '{"doc":{"name":"hykes","age":"25"}}'
```

执行更新操作的时候,ES首先将旧的文档标记为删除状态,然后添加新的文档.旧的文档不会立即消失，
但是你也无法访问,ES会在你继续添加更多数据的时候在后台清理已经标记为删除状态的文档

------
### 删除

```
curl -XDELETE http://localhost:9200/elasticsearch-samples/users/3/
```

如果文档存在，es会返回200 ok的状态码，found属性值为true，`_`version属性的值+1
found属性值为false，但是_version属性的值依然会+1，这个就是内部管理的一部分，它保证了我们在多个节点间的不同操作的顺序都被正确标记了
注意：删除一个文档也不会立即生效，它只是被标记成已删除。Elasticsearch将会在你之后添加更多索引的时候才会在后台进行删除内容的清理

通过查询API删除指定索引库下指定类型下的数据

```
curl -XDELETE 'http://localhost:9200/elasticsearch-samples/users/_query?q=age:24'
curl -XDELETE 'http://localhost:9200/elasticsearch-samples/users/_query' -d '{"query" : {"term" : { "name" : "hykes" }}}'
```

通过查询API删除指定索引库下多种类型下的数据

```
curl -XDELETE 'http://localhost:9200/elasticsearch-samples/users,test/_query?q=name:hykes'
```

通过查询API删除多个索引库下多种类型下的数据

```
curl -XDELETE 'http://localhost:9200/elasticsearch-samples,test/users,test/emp,user/_query?q=name:hykes'
```

删除所有索引库中的匹配的数据

```
curl -XDELETE 'http://localhost:9200/_all/_query?q=name:hykes'
```

------

### bukl批量处理

与mget类似，bulk API可以帮助我们同时执行多个请求

1、bulk相当于数据库里的bash操作。

2、引入批量操作bulk，提高工作效率.

3、bulk API可以帮助我们同时执行多个请求.

4、格式

```
action：index/create/update/delete
metadata：_index,_type,_id
request body：_source(删除操作不需要)

{ action: { metadata }}
{ request body }
{ action: { metadata }}
{ request body }

{ "index" : { "_index" : "elasticsearch-samples", "_type" : "users", "_id" : "2" } }
{ "name" : "love chris" , "age" : "25" }
{ "update" : { "_index" : "elasticsearch-samples", "_type" : "users", "_id" : "2" } }
{ "doc" : { "age" : 24 }}
```

5、bulk里为什么不支持get呢？

　　答：批量操作，里面放get操作，没啥用！所以，官方也不支持。

6、create 和index的区别

　　如果数据存在，使用create操作失败，会提示文档已经存在，使用index则可以成功执行。

 7、bulk一次最大处理多少数据量？

　　bulk会把将要处理的数据载入内存中，所以数据量是有限制的，最佳的数据量不是一个确定的数值，它取决于你的硬件，你的文档大小以及复杂性，你的索引以及搜索的负载。

　　一般建议是1000-5000个文档，如果你的文档很大，可以适当减少队列，大小建议是5-15MB，默认不能超过100M，可以在es的配置文件（即$ES_HOME下的config下的elasticsearch.yml）中修改 http.max_content_length: 100mb。


使用文件的方式

```
 vi requests
 curl -XPOST/PUT localhost:9200/_bulk --data-binary @request;
```

bulk请求可以在URL中声明/`_`index 或者/`_`index/`_`type

------
### Elasticsearch的版本控制

普通关系型数据库使用的是（悲观并发控制（PCC））
当我们在读取一个数据前先锁定这一行，然后确保只有读取到数据的这个线程可以修改这一行数据
ES使用的是（乐观并发控制（OCC））
ES不会阻止某一数据的访问，然而，如果基础数据在我们读取和写入的间隔中发生了变化，更新就会失败，这时候就由程序来决定如何处理这个冲突。它可以重新读取新数据来进行更新，又或者将这一情况直接反馈给用户。

ES如何实现版本控制(使用es内部版本号)
1：首先得到需要修改的文档，获取版本(`_`version)号

```
curl -XGET http://localhost:9200/elasticsearch-samples/users/1
```

2：在执行更新操作的时候把版本号传过去

```
(覆盖)
curl -XPUT http://localhost:9200/elasticsearch-samples/users/1?version=2 -d '{"name":"hhy","age":25}'
(部分更新)
curl -XPOST http://localhost:9200/elasticsearch-samples/users/1/_update?version=1 -d '{"doc":{"name":"hhy","age":"24"}}'
```

3：如果传递的版本号和待更新的文档的版本号不一致，则会更新失败

ES如何实现版本控制(使用外部版本号)
如果你的数据库已经存在了版本号，或者是可以代表版本的时间戳。这时就可以在es的查询url后面添加version_type=external来使用这些号码。
注意：版本号码必须要是大于0小于9223372036854775807（Java中long的最大正值）的整数。
es在处理外部版本号的时候，它不再检查_version是否与请求中指定的数值是否相等，而是检查当前的_version是否比指定的数值小，如果小，则请求成功。

```
curl -XPUT 'http://localhost:9200/elasticsearch-samples/users/1?version=10&version_type=external' -d '{"name": "laoxiao"}'
```

注意：此处url前后的引号不能省略，否则执行的时候会报错。

------

1.查询索引下mapping的信息

```
curl -XGET http://localhost:9200/elasticsearch-samples/_mapping?pretty
```

2 .查询索引下settting的信息

```curl
curl -XGET http://localhost:9200/elasticsearch-samples/_settings?pretty
```

!> 本文基于 [知识共享署名-相同方式共享 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh) 国际许可协议发布，欢迎转载，演绎或用于商业目的，但是必须保留本文的署名及链接。

