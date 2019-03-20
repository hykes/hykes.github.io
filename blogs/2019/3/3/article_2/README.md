# 理解电商体系中的商品、SPU、SKU、类目、属性等概念

如果你在一个电商部门，或者经验过淘宝店铺，应该会经常听到看到SPU、SKU这样的名词。那么到底什么是SPU、SKU呢。本文将以我的理解，对这些名词作出描述。

## 产品

通常指标准化产品，由类目+关键属性唯一确定。例如：手机类目，关键属性是品牌和型号，Nokia N95就是一个产品,nokia是品牌，N95是型号。iPhone 6S 也是一个产品，iPhone(苹果)是品牌，6S 是型号。

## SPU

SPU即标准化产品单元，全英文为 Standard Product Unit，SPU 相当于一个产品。可以理解为平台预先定义好的一个产品模版。

## SKU
SKU=Stock Keeping Unit(库存量单位)，SKU指销售属性的组合，表示一组最小销售单位，为保存库存控制的最小可用单位，例如一件T恤中一个SKU通常由颜色、尺码组成。

通常，我们所说的可下单的商品，指的就是 SKU。当然，发布多个SKU的单品(此处概念升级为产品)也是可行的。

## 类目

类目体系分为后台分类和前台分类。
后台分类面向商家，用来挂载商品和属性，稳定性高，变化少；
前台分类面向用户，方便用户查找商品，灵活性高，可以根据季节、节假日、活动变化。
后台类目和前台类目之间通过映射联系起来，一个后台类目可以映射到多个前台类目，一个前台类目也可以包含多个后台类目。
从技术的角度来看的话，前台类目就是在后台类目的基础上建立了一个虚拟类目。

### 前台类目

前台分类面向用户，方便用户筛选查找商品，大部分时候用户见到的类目都是前台类目。

前台类目有如下特点：

- 用户购买时看到的类目是前台类目。
- 前台类目通过跟后台映射间接和商品关联。
- 前台类目由后台叶子类目+属性组成，一个前台类目可以包含多个后台类目，一个后台类目也可以映射给多个前台类目。
- 前台类目不直接挂载属性模版，前台类目对应的属性来自后台叶子类目的公共属性。
- 前台类目很灵活，可重叠，可删除。

### 后台类目

后台类目面向商家，主要用于商品的分类和属性管理。商家上传商品时见到的就是后台类目

后台类目有如下特点：
- 后台类目树中最重要的是叶子类目，也就是类目树上不能再往下分的类目,任何商品都必须挂载到后台叶子类目上。
- 叶子类目挂载属性模版，商家发布商品时选择好后台类目之后会根据属性模版，补充必填的商品属性信息，方可成功上传商品。
- 后台类目相对稳定，不能随便删除，叶子类目不能重复。

### 类目属性在搜索上的应用

类目属性体系是可以帮助提升搜索的精准度：

- 只在相同类目下搜索，可以根据类目和属性筛选
- 可以做好搜索算法的垂直化优化
- 可以做基于类目和属性的个性化搜索

## 属性

属性名和属性值都归属于类目。基于类目创建一个新的产品时，勾选该类目下一个或多个销售属性作为该产品的销售属性，其余属性需要当作普通属性展示。

### 关键属性

能够确认唯一"产品"的属性，可以是一个，或者多个关键属性的组合。如：手机的"品牌""型号"能确定唯一的产品，服装的"品牌""货号"能确定唯一的产品。

### 销售属性

组成SKU的特殊属性，它会影响买家的购买和卖家的库存管理，如服装的"颜色"、"套餐"和"尺码"。当颜色在特定类目下是销售属性时，卖家发布宝贝的时候上传了颜色图片,则颜色属性值直接显示图片.否则显示属性值别名或属性值名

### 商品属性

一些对商品进行描述的属性，比如新旧程度、保修方式等

部分SKU的属性值可以卖家自定义编辑，部分不可编辑。可搜索

如果是平台发货，导入的商品新增的销售属性，可以同步回类目属性中。
如果是供应商店铺发货，则无需同步回去，避免属性值暴增。
