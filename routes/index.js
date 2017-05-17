var crypto = require('crypto'); // 加密模块
var path = require('path');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
var pageSize = require('../config').pageSize;
// 路由
function router(app) {
  /*var name;
   if(!req.session.user){
   name = null;
   }else {
   name = req.session.user.name;
   }*/

  // 显示首页
  app.get('/', function (req, res, next) {
    // console.log(1);
    next();
    // console.log(4);
  })
  app.get('/', function (req, res) {
    // console.log(2);
    // var name = null;
    var page = parseInt(req.query.page) || 1;
    if (page == 0) {
      page = 1;
    }
    /*if (req.session.user) {
     name = req.session.user.name;
     }*/
    // 首页
    Post.getAllBySize(null, page, pageSize, function (err, posts, total) {
      // console.log(5)
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        posts: posts,
        page: page,
        isFirstPage: page == 1,
        isLastPage: (page - 1 ) * pageSize + posts.length == total
      });
    });
    // console.log(3)
  });

  // 显示注册
  app.get('/register', checkHadLogin);
  app.get('/register', function (req, res) {
    res.render('register', {
      title: '注册',
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
      user: req.session.user
    });
  });

  // 注册请求
  app.post('/register', checkHadLogin);
  app.post('/register', function (req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var cfmpassword = req.body.cfmpassword;
    // 检测密码两次是否一致
    if (password != cfmpassword) {
      req.flash('error', '两次密码输入不一致');
      return res.redirect('/register');
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5');
    var md_password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: md_password,
      email: req.body.email
    });
    // 检测用户是否已经存在
    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return req.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已经存在');
        return res.redirect('/register');
      }
      newUser.save(function (err, user) {
        if (err) {
          req.flash('error', err);
          return req.redirect('/register');
        }
        req.session.user = newUser;//用户信息存入 session
        req.flash('success', '注册成功!');
        res.redirect('/');//注册成功后返回主页
      });
    })
  });

  // 登录请求
  app.post('/login', checkHadLogin);
  app.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    // 检测用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('/login');
      }
      if (user.password !== password) {
        req.flash('error', '密码错误');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登录成功');
      return res.redirect('/');
    })
  });

  // 显示登录
  app.get('/login', checkHadLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
      title: '登录',
      user: req.session.user
    })
  });

  // 显示登出
  app.get('/logout', checkNoLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });

  // 显示发表
  app.get('/post', checkNoLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
    });
  });

  // 发表请求
  app.post('/post', checkNoLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user;
    // 这里根据请求头用户名在图片服务器可做用户头像，这里就写死了
    var head = '/images/mm.jpg';
    var post = new Post(currentUser.name, req.body.title, req.body.post, [req.body.tag1, req.body.tag2, req.body.tag3], head);
    post.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', '发布成功');
      res.redirect('/');
    });
  });

  // 详情页
  app.get('/detail/:name/:day/:title', function (req, res) {
    var name = req.params.name;
    var day = req.params.day;
    var title = req.params.title;
    Post.getPostByName(name, day, title, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('detail', {
        title: title,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        post: post,
      });
    });
  });
  // 提交评论
  app.post('/detail/:name/:day/:title', function (req, res) {
    var name = req.params.name;
    var day = req.params.day;
    var title = req.params.title;
    var comment = req.body.comment;
    var new_comment = new Comment(
      name,
      day,
      title,
      comment
    );
    new_comment.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('sucess', '评论成功');
      return res.redirect('/detail/' + name + '/' + day + '/' + title);
    });
  });

  // 删除
  app.get('/remove/:name/:day/:title', checkNoLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var name = req.params.name;
    var day = req.params.day;
    var title = req.params.title;
    Post.removePost(name, day, title, function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '删除成功');
      res.redirect('/');
    });
  });

  // 查询
  app.get('/search', function (req, res) {
    var keyword = req.query.keyword;
    Post.searchPost(keyword, function (err, posts) {
      if (err) {
        req.flash('error', err);
        res.redirect('/');
      }
      res.render('search', {
        title: '搜索：' + keyword,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        user: req.session.user
      });
    });
  });

  // 我的
  app.get('/my', function (req, res) {
    var user = req.session.user;
    var page = parseInt(req.query.page) || 1;
    if (page == 0) {
      page = 1;
    }
    User.get(user.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      Post.getAllBySize(user.name, page, pageSize, function (err, posts, total) {
        res.render('user', {
          title: user.name,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString(),
          posts: posts,
          page: page,
          isFirstPage: page == 1,
          isLastPage: (page - 1 ) * pageSize + posts.length == total
        });
      });
    });
  });

  // 编辑
  app.get('/edit/:name/:day/:title', checkNoLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var name = req.params.name;
    var day = req.params.day;
    var title = req.params.title;
    Post.editPost(name, day, title, function (err, post) {
      if (err) {
        req.flash('error', '获取失败')
        return res.redirect('/')
      }
      res.render('edit', {
        title: '编辑',
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        post: post,
        user: req.session.user
      });
    });
  })
  app.post('/edit/:name/:day/:title', checkNoLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var parday = req.params.day;
    var partitle = req.params.title;
    var currentUser = req.session.user;
    var partarget = req.body;
    Post.savePost(currentUser.name, parday, partitle, partarget, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      console.log(post)
      var reUrl = encodeURI('/detail/' + currentUser.name + '/' + post.time.day + '/' + post.title);
      req.flash('success', '修改成功');
      res.redirect(reUrl);
    });
  });

  // 检测未登录
  function checkNoLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录');
      res.redirect('/login');
    }
    next();
  }

  // 检测已登录
  function checkHadLogin(req, res, next) {
    if (req.session.user) {
      req.flash('success', '已登录');
      res.redirect('back');
    }
    next();
  }
};

module.exports = router;