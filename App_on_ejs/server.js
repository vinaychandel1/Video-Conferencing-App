require('dotenv').config();
const express = require("express");
const app= require('express')();
const os = require('os');
const nodeStatic = require('node-static');
const server= require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require("body-parser");
var sslr = require('heroku-ssl-redirect');

const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const api = require('./APIRoutes');


app.use(sslr());
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/',(req,res)=>{
	res.render('index');
});


mongoose.connect("mongodb://localhost:27017/webRTC", {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);


server.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port : 3000");
});


io.sockets.on('connection', function(socket) {
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
  socket.on('message', function(message) {
    console.log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });
  socket.on('create or join', function(room,isHost) {
	  console.log('Received request to create or join room ' + room);
	  var clientsInRoom = io.sockets.adapter.rooms[room];
	  var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
	  console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
	  if(numClients === 0 && isHost === false){
      console.log("Don't have permission!");
		}else if (numClients === 0) {
      socket.join(room);
      console.log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);
    } else if (numClients < 51) {
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id,numClients);
      io.sockets.in(room).emit('ready');
    } else { // max 50 clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });
});







app.use('/', api);
module.exports = app;