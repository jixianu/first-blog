原文：http://www.open-open.com/lib/view/open1454560780730.html#articleHeader11

记录：
- "mongodb": "^2.0.52",版本要最新 @1.X.X会报bson错

指令：
启动数据库服务器：

    mongod --dbpath dburl   //根据URL启动db服务

查看数据库：
1. mongo
2. use blog
3. db.users.find()


操作数据库：
- 连接数据库
        运行mongo
- 使用blog库
        use blog
- 查找文档
        db.users.find()
- 删除users
        db.users.drop()
- 删除数据
        db.users.remove({"name":"wq"})
- 更新数据
        db.users.update({},{},callback)

插件
connect-flash http://yunkus.com/connect-flash-usage/

功能：
- 用户注册
- 登陆
- 页面权限控制
- 文章的增删改查
- 评论
- 
