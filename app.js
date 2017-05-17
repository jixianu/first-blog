var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var config = require('./config');
var routes = require('./routes/index');

var app = express();
/**
 * 将会化信息存储到mongoldb
 * secret 用来防止篡改 cookie，
 * key 的值为 cookie 的名字，
 * 通过设置 cookie 的 maxAge 值设定 cookie 的生存期，这里我们设置 cookie 的生存期为 30 天，
 * 设置它的 store 参数为 MongoStore 实例，把会话信息存储到数据库中，以避免丢失
 */


// 设置 views 文件夹为存放视图文件的目录
app.set('views', path.join(__dirname, 'views'));
// 设置视图模板引擎为 ejs
app.set('view engine', 'ejs');

// 使用flash模块
app.use(flash());
// uncomment after placing your favicon in /public
// 设置ico图标
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// 加载日志中间件
app.use(logger('dev'));
// 加载解析json的中间件
app.use(bodyParser.json());
// 加载解析urlencoded请求体的中间件
app.use(bodyParser.urlencoded({ extended: false }));
// 加载解析cookie的中间件
app.use(cookieParser());
// 设置public文件夹为存放静态文件的目录
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.cookieSecret,
  key: config.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    /*db: settings.db,
     host: settings.host,
     port: settings.port*/
    url: 'mongodb://localhost/blog'
  })
}));
// 路由
routes(app);

// catch 404 and forward to error handler
// 捕获404错误，并转发到错误处理器。
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
