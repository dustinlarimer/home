var express = require('express')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , http = require('http')
  , morgan = require('morgan');

var app = express()
  , port = process.env.PORT || 8000
  , secret = process.env.COOKIE_SECRET || 'secret-string'
  , server;

app.use( express.static(__dirname + '/public') );
app.use( cookieParser(secret) );
app.use( bodyParser.urlencoded({ extended: true }) );
app.use( bodyParser.json() );
app.use( morgan('combined') );

app.set('views', './app');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

app.get('/', function(req, res) {
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
  res.redirect('back');
});

server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
