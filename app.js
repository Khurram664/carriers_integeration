var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var customersRouter = require('./routes/customers');
var areacodesRouter = require('./routes/areacodes');
var numbersRouter = require('./routes/numbers');
var didgroupRouter = require('./routes/didgroups');
var dashboardRouter = require('./routes/dashboard');
var jwt = require("jsonwebtoken");

var cors = require('cors');
var app = express();

// AuthController.js
var VerifyToken = require('./config/verifyToken');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/customers', customersRouter);
app.use('/areacodes', areacodesRouter);
app.use('/numbers', numbersRouter);
app.use('/groups', didgroupRouter);
app.use('/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
