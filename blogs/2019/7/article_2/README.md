# 记一次服务器磁盘分区挂载操作

## 查看当前系统所有硬盘及分区情况

```shell
fdisk -l
```

![IMAGE](F42CA019C07941BE444B3422918C7265.jpg ':size=687x553')

从上图可以看出，除了第一块硬盘（/dev/sda）外，还有第二块硬盘（/dev/sdb）存在。

## 在指定的硬盘上创建分区

```shell
fdisk /dev/sdb
```
- 输入 m，显示帮助命令

![IMAGE](9D4088309962F108CABA7301B47A3271.jpg ':size=602x572')

- 输入 n 进行分区
- Partition type：p 为主分区，e 为逻辑分区。这里我们将这块盘分为主分区即输入 p
- Partition number：输入该主分区为第几个主分区，由于是新盘，输入1，表示第一个主分区

![IMAGE](8069E799AF82ED2C90FE691ACF6A56B6.jpg ':size=672x351')

- 分区成功后，写分区表并退出（w）

![IMAGE](CE6462C090F6356ECF77CD49EA09CBCB.jpg ':size=543x125')

- 如果有 WARNING，则需要查询具体原因

![IMAGE](4B69E8FBCC03A8E41BDAED81E0C8637A.jpg ':size=668x160')

## 查看所有可用块设备的信息

```shell
lsblk
# 该命令用语列出所有可用块设备的信息，而且还能显示他们之间的依赖关系，但是它不会列出RAM盘的信息。
```

![IMAGE](E8D071D2A5CC15187BF9270AC2684E55.jpg ':size=560x212')

可以看到我们成功的创建了一个30G空间大小的分区 sdb1，MOUNTPOINT 为空。

## 查看磁盘使用情况

```shell
df -h
# 查看目前在Linux系统上的文件系统的磁盘使用情况统计。
```

![IMAGE](9AD0FBF1EA8F2B4570236359EC335C1D.jpg ':size=630x327')

当前，新分区 sdb1 未挂载。

> Filesystem: 文件系统

> Size: 文件大小

> Used: 使用空间

> Avail: 剩余空间

> Use%: 空间使用百分比

> Mounted on: 挂载的目录

> 如果磁盘是SATA接口，且有多个磁盘，则每个磁盘被标记为 /dev/hda、/dev/hdb、等以此类推；而每个磁盘的分区被标记为 /dev/hda1、 /dev/hda2等。

> 如果磁盘是SCSI类型，则多个磁盘会被分别标记为 /dev/sda、/dev/sdb等等。分区同理。

## 格式化分区

```
sudo mkfs -t ext4 /dev/sdb1  
# sdb1 都是存在于 /dev 目录下面的
```

![IMAGE](50B7357E59886DF59A267EB8AE29A3FE.jpg ':size=702x430')

## 挂载分区

- 创建分区挂载目录

```
sudo mkdir /data
```

- 把格式化后的分区 mount 到目录 /data

```
sudo mount /dev/sdb1 /data
```

![IMAGE](12285E3EA391A95B2ED0C76FD8D5D502.jpg ':size=398x44')

- 使用 df -h 命令查看是否挂载成功

![IMAGE](23AD4BFF7D2E868DF59996FA6F25E2EF.jpg ':size=570x192')

- 如果想每次系统重启都能自动挂载该分区，编辑 /etc/fstab 配置文件

```shell
vi /etc/fstab
# 在最后一行写入
/dev/sdb1 /data ext4 defaults 0 2 
```

![IMAGE](ECE714BDFC94DAE280305CC58EAE0622.jpg ':size=716x212')

> 第一列可以是实际分区名，也可以是实际分区的卷标（Lable）。 

> 第二列是挂载点。挂载点必须为当前已经存在的目录，建议将其权限设置为777，以开放所有权限。

> 第三列为此分区的文件系统类型。

> 第四列是挂载的选项，用于设置挂载的参数。defaults: rw, suid, dev, exec, auto, nouser, and async. 

> 第五列是dump备份设置。当其值设置为1时，将允许dump备份程序备份；设置为0时，忽略备份操作。

> 第六列是fsck磁盘检查设置。其值是一个顺序。当其值为0时，永远不检查；而 / 根目录分区永远都为1。其它分区从2开始，数字越小越先检查，如果两个分区的数字相同，则同时检查。

- 加载新分区

```shell
sudo mount -a
```

![IMAGE](983324B90843C97CA214B6FD22F24E23.jpg ':size=304x49')

- 查看所有可用块设备的信息，分区 sdb1 已挂载至目录 /data

![IMAGE](FAA680A381F8A0D8C9DD4B353D2BE1EA.jpg ':size=564x213')

## 卸载分区

```shell
umount /dev/sdb1
```