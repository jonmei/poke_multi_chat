var Message = require('../models/message');
var _ = require('lodash');
var cookie = require("cookie");
var users = {};
const antiSpam  = require('socket-anti-spam');


module.exports = function(app) {
    antiSpam.init({
        io: app.io.of('/chat')      // Bind the socket.io variable
    });

    antiSpam.event.on('authenticate', function(socket) {
        // We have the socket var that tried to authenticate
        // We could get his IP
        console.log('Connected : ' + socket.ip);
    });



    app.io.of('/chat').on('connection', function(socket) {

        antiSpam.event.on('kick', function(socket, data) {
            // We have the socket var that was banned
            // The second parameter is a object that was binded to the socket with some extra information
            // It's how socket-anti-spam keeps track of sockets and their states

        });

        var city = socket.request.user.local.city || socket.request.user.facebook.city || getCookie('city');
        var team = socket.request.user.local.team || socket.request.user.facebook.team || getCookie('team');
        var client = socket.request.user.local.email || socket.request.user.facebook.email;
        var name = socket.request.user.local.name || socket.request.user.facebook.name;
        var rooms = [city,team,city+team,'all'];
        var currentRoom;

        if(_.find(users, function(o){ return o.indexOf(client) !== -1})) {
            socket.disconnect();
        }
        // Initialize user data for the chat
        socket.emit('init',{city: city, team: team, name: name});

        // Join to room
        socket.on('subscribe', function(roomId) {
            console.log('subscribed by ' + name);
            if(!users[rooms[roomId]]) users[rooms[roomId]] = [];
            users[rooms[roomId]].push(client);
            socket.join(rooms[roomId]);
            var query =  Message.find({room: rooms[roomId]});
            query.sort('-created').limit(50).exec(function(err, docs) {
                if(err) throw err;
                socket.emit('load old msgs', { docs: docs });
            });
            currentRoom = roomId;
            updateUsers();
        });

        // Leave room
        socket.on('unsubscribe', function(roomId) {
            var index = users[rooms[roomId]].indexOf(client);
            users[rooms[roomId]].splice(index, 1);
            socket.leave(rooms[roomId]);
            updateUsers();
        });

        // Send message
        socket.on('chat message', function(msg){
            antiSpam.addSpam(socket);
            var newMsg = new Message({msg: msg, name: name, room: rooms[currentRoom]});
            newMsg.save(function(err) {
                if(err) throw err;
                app.io.of('/chat').in(rooms[currentRoom]).emit('chat message', {name: name, msg: msg});
            });
        });

        // User typing
        socket.on('typing', function(data) {
            app.io.of('/chat').in(rooms[currentRoom]).emit("isTyping", {isTyping: data, name: name});
        });

        // Disconnect
        socket.on('disconnect', function(){
            console.log('Disconnected : '+ name);
            if(users[rooms[currentRoom]]) {
                var index =  users[rooms[currentRoom]].indexOf(client);
                users[rooms[currentRoom]].splice(index, 1);
                updateUsers();
            }
        });

        function updateUsers() {
            app.io.of('/chat').in(rooms[currentRoom]).emit('users', users[rooms[currentRoom]]);
        }
        function getCookie(name) {
            var value = "; " + socket.handshake.headers.cookie;
            var parts = value.split("; " + name + "=");
            if (parts.length == 2) return parts.pop().split(";").shift();
        }
    });

};