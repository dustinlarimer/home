var express = require('express')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , morgan = require('morgan')
  , uuid = require('node-uuid');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var PORT = process.env.PORT || 8000
  , SECRET = process.env.COOKIE_SECRET || 'secret-string';


// Middleware
// -------------------------
app.use(express.static(__dirname + '/public'));
app.use(cookieParser(SECRET));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('combined'));

app.set('views', './app');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);


// Routes
// -------------------------
app.get('/', function(req, res) {
  console.log(req.session);
  res.render('index', { visitor: req.cookies.remember || { name: 'friend' } });
});

app.get('/forget', function(req, res) {
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


// Start server
// -------------------------
server.listen(PORT, function(){
  console.log('Listening on port %d', server.address().port);
});


// Open sockets
// -------------------------
io.on('connection', function (socket) {

  socket.emit('message:robot', { msg: 'Hi, I\'m a robot!' });
  socket.on('message:guest', function (data, fn) {
    if (fn) fn(data);
    //socket.emit('message:robot', { msg: 'oh, that is quite wonderful' });
    console.log(data);
  });

});
