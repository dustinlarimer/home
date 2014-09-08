!function(){
  var socket = io.connect('http://localhost');
  socket.on('message:robot', function(data){
    console.log(data);
    socket.emit('message:guest', { msg: 'Hello, bot' });
  });
}();
