var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

// 储存用户信息
User.prototype.save = function(callback){
  // 存入数据库的用户文档
  var user = {
    name: this.name,
    password: this.password,
    email: this.email
  };
  // 打开数据库
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }
  //  读取users集合
    db.collection('users', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.insert(user, {
        safe: true
      }, function(err, user){
        mongodb.close();
        if (err) {
          return callback(err);
        }
        // 成功！err 为 null，并返回存储后的用户文档
        callback(null, user[0]);
      })
    })
  })
}

// 获取用户信息
User.get = function(name, callback){
  // 打开数据库
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }
    db.collection('users', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        name: name
      }, function(err, user){
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, user);//成功！返回查询的用户信息
      })
    })
  })
}
