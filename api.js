var static = require("node-static")
var file = new(static.Server)('./public')

var app = require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    file.serve(request, response)
  })
})

var io = require("socket.io").listen(app)
io.sockets.on("connection", function(socket){
  socket.on("message",function(message){
    console.log(message);
    socket.broadcast.emit("message", message)
  })
})

app.listen(8080);
