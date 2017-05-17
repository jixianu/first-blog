var mongodb = require('./db');

function Post(name, title, post, tags, head) {
  this.name = name;
  this.title = title;
  this.post = post;
  this.tags = tags;
  this.head = head;
}
// 存文章
Post.prototype.save = function (callback) {
  //存储各种时间格式，方便以后扩展
  var date = new Date(),
    year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate(),
    time = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

  var timeObj = {
    date: date,
    year: year,
    month: year + "-" + month,
    day: year + "-" + month + "-" + day,
    minute: year + "-" + month + "-" + day + " " + time
  }
  // 存入数据库的文档
  var post = {
    name: this.name,
    time: timeObj,
    title: this.title,
    post: this.post,
    tags: this.tags,
    head: this.head,
    comments: [],
    pv: 0
  };
  // 打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    // 读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // 将文档存入posts集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err); // 失败！返回err
        }
        callback(null);
      });
    });
  });
}

// 根据pageSize获取数据
Post.getAllBySize = function (name, page, pageSize, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      collection.count(query, function (err, total) {
        if (err) {
          return callback(err);
        }
        collection.find(query).skip((page - 1) * pageSize).limit(pageSize).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null, docs, total);
        });
      });
    });
  });
}

// 获取单个数据
Post.getPostByName = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (title) {
        query.title = title;
        query.name = name;
        query["time.day"] = day;
      }
      collection.findOne({
        "title": title,
        "name": name,
        "time.day": day
      }, function (err, post) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        if (post) {
          collection.update({
            "title": title,
            "name": name,
            "time.day": day
          }, {
            $inc: {pv: 1}
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
        }
        callback(null, post);
      });
    });
  });
}

// 获取编辑的单个数据
Post.editPost = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (title) {
        query.title = title;
        query.name = name;
        query["time.day"] = day;
      }
      collection.findOne({
        "title": title,
        "name": name,
        "time.day": day
      }, function (err, post) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        callback(null, post);
      });
    });
  });
}

// 保存编辑的单个数据
Post.savePost = function (name, day, title, target, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var _date = new Date(),
        _year = _date.getFullYear(),
        _month = _date.getMonth() + 1,
        _day = _date.getDate();

      collection.updateOne({
        name: name,
        "time.day": day,
        title: title
      }, {
        $set: {
          title: target.title,
          post: target.post,
          tags: [target.tag1, target.tag2, target.tag3],
          "time.day": _year + "-" + _month + "-" + _day,
        }
      }, function (err) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        collection.findOne({
          name: name,
          "time.day": _year + "-" + _month + "-" + _day,
          title: target.title
        }, function (err, post) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null, post);
        })
      });
    });
  });
}

// 删除单个数据
Post.removePost = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        return callback(err);
      }
      collection.deleteOne({
        name: name,
        "time.day": day,
        title: title
      }, function (err) {
        if (err) {
          mongodb.close();
          callback(err);
        }
        callback(null);
      })
    })
  });
}

// 搜索数据
Post.searchPost = function (title, callback){
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var reg = new RegExp(title, 'i')
      collection.find({
        title: reg
      }).sort({
        time: -1
      }).toArray(function (err, posts) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, posts);
      });
    });
  });
}
module.exports = Post;