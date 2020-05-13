const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./model/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./model/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//  Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Wellcome current user
        socket.emit('message', formatMessage(botName, 'Wellcome to ChatCord'));
    
        // Broadchast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
       io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    // Run when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        };
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});

const PORT = 5000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server runing on port ${PORT}`));