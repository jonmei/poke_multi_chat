var express = require('express');
var app = express();
var http = require('http').Server(app);
var passportSocketIo = require('passport.socketio');
app.io = require('socket.io')(http);

var helmet = require('helmet');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var configDB = require('./config/database.js');

// Global
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

var sessionStore = new MongoStore(
    {mongooseConnection:mongoose.connection}
);
// DB connection
mongoose.connect(configDB.url);

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(helmet());

// Socket session
app.io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: 'SECRET_KEY',
    store: sessionStore,
    passport: passport,
    cookieParser: cookieParser
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// required for passport
app.use(session({
    secret: 'SECRET_KEY',
    store: sessionStore

})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// User security
app.use(session({
    secret: 'anything'
}));

app.use(passport.initialize());
app.use(passport.session());

http.listen(8002);


// routes ======================================================================
require('./routes/routes.js')(app, passport, http); // load our routes and pass in our app and fully configured

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

