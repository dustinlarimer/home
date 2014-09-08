var express = require('express')
  , redis = require('redis')
  , session = require('express-session')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , http = require('http')
  , morgan = require('morgan')
  , uuid = require('node-uuid');

var app = express()
  , PORT = process.env.PORT || 8000
  , SECRET = process.env.COOKIE_SECRET || 'secret-string'
  , server;

var RedisStore = require('connect-redis')(session)
  , redisClient = redis.createClient();

redisClient
  .on('error', function(err) {
    console.log('Error connecting to redis %j', err);
  })
  .on('connect', function() {
    console.log('Connected to redis.');
  })
  .on('ready', function() {
    console.log('Redis client ready.');
  });

app.set('redisClient', redisClient);
app.use(session({
  genid: function(req) {
    return uuid.v1();
  },
  store: new RedisStore({ client: redisClient }),
  secret: SECRET,
  saveUninitialized: true,
  resave: true,
  cookie: { maxAge: 60 * 1000 }
}));

app.use( express.static(__dirname + '/public') );
app.use( cookieParser(SECRET) );
app.use( bodyParser.urlencoded({ extended: true }) );
app.use( bodyParser.json() );
app.use( morgan('combined') );

app.set('views', './app');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

app.get('/', function(req, res) {
  console.log(req.session);
  //req.session.
  res.render('index', { visitor: req.cookies.remember || { name: 'friend' } });
});

app.get('/forget', function(req, res) {
  req.logout();
  res.clearCookie('remember');
  res.redirect('back');
});

app.post('/', function(req, res) {
  var minute = 60 * 1000;
  if (req.body.remember) {
    res.cookie('remember', { name: req.body.remember }, { maxAge: minute });
  }
  if (req.body.message) {
    console.log("» ", { message: req.body.message });
  }

  res.redirect('back');
});

server = app.listen(PORT, function() {
  console.log('Listening on port %d', server.address().port);
});
