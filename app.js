var ip = require("ip");

require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const passport = require('passport');
const DZBStrategy = require('passport-openid-connect').Strategy;

const index = require('./routes/index');
const users = require('./routes/users');

const hostip = 'http://' + ip.address()
const redirect_uri = hostip + ':4001/oauth/callback';
process.env.LOGOUT = 'http://dzbvm-badi.dzbnet.local:5555/auth/realms/dzb/protocol/openid-connect/logout?redirect_uri=' + redirect_uri;


const oic = new DZBStrategy({
    issuerHost: 'http://dzbvm-badi.dzbnet.local:5555/auth/realms/dzb',
    client_id: 'nextcloud',
    client_secret: '86ed96cb-39d7-46cf-b00e-5e1ff2769011',
    redirect_uri: redirect_uri,
    scope: 'openid userinfo'
});


passport.use(oic);
passport.serializeUser(DZBStrategy.serializeUser);
passport.deserializeUser(DZBStrategy.deserializeUser);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport requires session to persist the authentication
// so were using express-session for this example
app.use(session({
  secret: 'secret squirrel',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware for checking if a user has been authenticated
// via Passport and DZB OpenId Connect
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.redirect("/");
  }
}

app.use('/', index);
// Only allow authenticated users to access the /users route
app.use('/users', checkAuthentication, users);

// Initiates an authentication request with DZB
// The user will be redirect to DZB and once authenticated
// they will be returned to the callback handler below
app.get('/login', passport.authenticate('passport-openid-connect', {
  successReturnToOrRedirect: "/",
  scope: 'openid'
}));

// Callback handler that dzb openid will redirect back to
// after successfully authenticating the user
app.get('/oauth/callback', passport.authenticate('passport-openid-connect', {
  callback: true,
  successReturnToOrRedirect: '/users',
  failureRedirect: '/'
}));

// // Destroy both the local session and
// // revoke the access_token at OneLogin
// app.get('/logout', function(req, res){
//
//   request.get(`http://openid.dzb.de/auth/realms/dzb/protocol/openid-connect/logout?redirect_uri=http://localhost:3001`, {
//     // 'form':{
//     //   'client_id': process.env.OIDC_CLIENT_ID,
//     //   'client_secret': process.env.OIDC_CLIENT_SECRET,
//     //   'token': req.session.accessToken,
//     //   'token_type_hint': 'access_token'
//     // }
//   },function(err, respose, body){
//
//     console.log('Session Revoked');
//     //res.redirect('/');
//   });
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
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
