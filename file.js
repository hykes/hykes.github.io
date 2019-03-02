var fs = require("fs");
var path = require("path");

const argv = process.argv
if (argv.length <= 2) {
    console.log('请输入文本类型:blogs|draft')
    return
}
const type = argv[2]
if (type != 'blogs' && type != 'draft') {
    console.log('文本类型错误:blogs|draft')
    return
}

/**
 * 同步递归创建目录
 *
 * @param  {string} dir   处理的路径
 * @param  {function} cb  回调函数
 */
var mkdirs = function(dirname, callback) {  
    fs.exists(dirname, function (exists) {  
        if (exists) {  
            callback();  
        } else {  
            mkdirs(path.dirname(dirname), function () {  
                fs.mkdir(dirname, callback);  
            });  
        }  
    });  
}

/**
 * 创建文件
 *
 * @param  {string} file  文件名称
 * @param  {function} cb  回调函数
 */
var mkfile = function(file, cb) {
    fs.writeFile(file, "", { flag : "a" }, cb)
}

// 创建文件
var date = new Date()
var year = date.getFullYear()
var month = date.getMonth()+1
var day = date.getDate()
const filePath = path.join(__dirname, type + '/' + year + '/' + month + '/' + day + '/article_00')

mkdirs(filePath, function (err) {
    if(err){
        return console.log(err);
    }else{
        mkfile(filePath + '/README.md', function (err) {
            if(err){
                return console.log(err);
            }else{
                console.log("成功创建文件:", filePath + '/README.md');
            }
        })
    }
})
