var PORT = process.env.PORT || 8000
  , SECRET = process.env.COOKIE_SECRET || 'secret-string';

var express = require('express')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , http = require('http')
  , morgan = require('morgan')
  , redis = require('redis')
  , redisSession = require('connect-redis')
  , session = require('express-session')
  , sockets = require('socket.io')
  , uuid = require('node-uuid');

var app = express();
var server = http.Server(app);
var io = sockets(server);

var RedisStore = redisSession(session)
  , redisClient = redis.createClient();

var sessionStore = new RedisStore({ client: redisClient });

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

// Middleware
// -------------------------
app.use( express.static(__dirname + '/public') );
app.use( cookieParser(SECRET) );
app.use( bodyParser.urlencoded({ extended: true }) );
app.use( bodyParser.json() );
app.use( morgan('combined') );
app.use( session({
    cookie: {
      httpOnly: true,
      maxAge: 60 * 1000,
      rolling: true
    },
    store: sessionStore,
    secret: SECRET,
    saveUninitialized: true,
    resave: true
  }) );

app.set('redisClient', redisClient);
app.set('views', './app');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);


// Routes
// -------------------------
app.get('/', function(req, res) {
  res.cookie('dlbot', { name: 'friend' }, { maxAge: 60*1000 });
  req.session.cookie.name = 'friend';
  console.log(req.session.cookie);
  res.render('index', { visitor: { name: 'friend' } });
});

app.get('/forget', function(req, res) {
  res.clearCookie('dlbot');
  res.redirect('back');
});

// app.post('/', function(req, res) {
//   var minute = 60 * 1000;
//   if (req.body.remember) {
//     res.cookie('remember', { name: req.body.remember }, { maxAge: minute });
//   }
//   if (req.body.message) {
//     console.log("» ", { message: req.body.message });
//   }
//   res.redirect('back');
// });


// Start server
// -------------------------
server.listen(PORT, function(){
  console.log('Listening on port %d', server.address().port);
});


// Open sockets
// -------------------------
io.use(function(socket, next) {
  var handshake = socket.handshake;
  if (handshake.headers.cookie) {
    cookieParser(SECRET)(handshake, {}, function(err) {
      handshake.sessionID = handshake.signedCookies['connect.sid'];
        // <- 'connect.sid' > your key could be different, but this is the default
      handshake.sessionStore = sessionStore;
      handshake.sessionStore.get(handshake.sessionID, function(err, data) {
        if (err) return next(err);
        if (!data) return next(new Error('Invalid Session'));
        handshake.session = new session.Session(handshake, data);
        next();
      });
    });
  } else {
    next(new Error('Missing Cookies'));
  }
});

io.on('connection', function(socket){
  var session = socket.handshake.cookies['dlbot'];

  socket.emit('message:robot', { msg: 'hey there, ' + session.name +'!' });
  if (session.name === 'friend'){
    setTimeout(function(){
      socket.emit('message:robot', { msg: 'what\'s your name?' });
    }, 2500);
  }

  socket.on('message:guest', function (data, fn) {
    if (fn) fn(data);
    console.log(data);
  });

});
