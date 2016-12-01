var express = require('express');
var router = express.Router();

// DB
var Message = require('../models/message');

module.exports = function(http) {

    router.get('/', function(req, res, next) {
        res.render('users', {
            title: 'Chat',
            user: {
                name: req.user.displayName,
                image: req.user._json.image.url
            }
        });
        var io = require('socket.io')(http);
        io.on('connection', function(socket) {
            console.log('socket connected');
            // Leave room
            socket.on('unsubscribe', function(room) {
                socket.leave(room);
            });

            // Join to room
            socket.on('subscribe', function(room) {
                socket.join(room);
                var query =  Message.find({room: room});
                query.sort('-created').limit(20).exec(function(err, docs) {
                    if(err) throw err;
                    socket.emit('load old msgs', docs);
                });
                currentRoom = room;
            });

            // Send message
            socket.on('chat message', function(msg){
                var newMsg = new Message({msg: msg, name: req.user.displayName, room: currentRoom});
                newMsg.save(function(err) {
                    if(err) throw err;
                    io.sockets.in(currentRoom).emit('chat message', {name: req.user.displayName, msg: msg});
                });
            });
        });
    });

    return router;
};
