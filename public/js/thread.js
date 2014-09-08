$(function(){
  var socket = io.connect('http://localhost')
    , form = $("form.msg")
    , input = $("form.msg input[type=text]")
    , thread = $("ul.thread");

  input.focus();

  form.on("submit", function(e){
    var msg = input.val();
    if (msg) {
      input.attr("placeholder", "");
      appendMessage('guest', { msg: msg });
      socket.emit('message:guest', { msg: msg }, function(data){
        console.log("ECHO SENT:", data);
      });
      input.val("");
    }
    e.preventDefault();
    return false;
  });

  socket.on('message:robot', function(data){
    console.log("RECEIVED:", data);
    appendMessage('robot', data);
  });

  function appendMessage(from, data){
    var latest = thread.find("li").last().attr('class');
    var sender = (from === 'robot') ? 'robot' : 'guest';
    if (latest !== sender) {
      thread.append('<li class="' + sender + '" />');
    }
    thread.find('li').last().append('<p style="display: none">' + data.msg + '</p>');
    thread.find('p:hidden').fadeIn('slow');
  }
});
