const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const mongoClient = new MongoClient('mongodb://127.0.0.1:27017/chatdb');
let chatCollection; // Define chatCollection at a higher scope

async function connectDB() {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
        chatCollection = mongoClient.db("chatdb").collection("chats"); // Assign chatCollection here
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

connectDB();

let connectedUsers = {}; // Store connected users


function getConnectedUsersByRoom(room)
{
    console.log(typeof(room))
    console.log(`getConnectedUsers(${room}) called!`);
    console.log(connectedUsers);//Object.values(connectedUsers).filter(u => u.roomId === room).length)
    return Object.values(connectedUsers).filter(u => u.roomId === String(room).trim()).length;
}

function isUserTaken(username) {
    return Object.values(connectedUsers).some(user => user.username === username);
}



io.on('connection', (socket) => {
    // User joins the lobby
    connectedUsers[socket.id] = { username: "Guest", roomID: null };
    socket.on('joinRoom', async ({ username, roomId }) => {
        socket.join(roomId);
        connectedUsers[socket.id] = { username, roomId };
        const roomUserCount = getConnectedUsersByRoom(roomId);
        io.emit('updateUserCount', { roomId, count: roomUserCount });

        // Load and emit message history for the room
        const history = await chatCollection.find({ roomId }).toArray();
        socket.emit('loadHistory', history);
    });

        // Event to set username
        socket.on('setUsernameNew', ({ newUsername }) => {
            const user = connectedUsers[socket.id];
            if (user) {
                if (isUserTaken(newUsername))
                {
                    console.log(`Username for user ${socket.id} changed to ${newUsername}`);
                    let i = 1;
                    while (isUserTaken(`guest${i}`))
                    {
                        i++;
                    }
                    user.username = `guest${i}`;
                    socket.emit('usernameSet', `guest${i}`);
                }
                else
                {
                    user.username = newUsername;
                    // Emit an event back to the client to confirm the username change
                    socket.emit('usernameSet', newUsername);
                }
            }
        });

        socket.on('setUsername', ({ newUsername }) => {
            const user = connectedUsers[socket.id];
            if (user) {
                if (isUserTaken(newUsername))
                {
                    socket.emit('usernameTaken', { message: 'Username is already taken. Please choose a different one.' });
                }
                else
                {
                    user.username = newUsername;
                    console.log(`Username for user ${socket.id} changed to ${newUsername}`);
                    // Emit an event back to the client to confirm the username change
                    socket.emit('usernameSet', newUsername);
                }
            }
        });


        
        // Optional: Event to get username for a user
        socket.on('getUsername', () => {
            console.log(connectedUsers)
            const user = connectedUsers[socket.id];
            if (user && user.username) {
                socket.emit('usernameUpdated', user.username);
            }
        });

        socket.on('getUserCount', () => {
            // Loop through each room and emit how many connected users per room
            for (let i = 1; i <= 3; i++ )
            {
                const roomUserCount = getConnectedUsersByRoom(i);
                console.log(roomUserCount)
                //console.log(Object.values(connectedUsers));
                io.emit('updateUserCount', { roomId: i, count: roomUserCount });
            }
        })


    // User sends a chat message
    socket.on('chatMessage', async (msg) => {
        await chatCollection.insertOne(msg); // Save message to the database
        socket.to(msg.roomId).emit('newMessage', msg); // Emit to all in room except the sender
    });

    socket.on('disconnect', () => {
        const user = connectedUsers[socket.id];
        const roomId = user.roomId;
        console.log(user);
        const roomUserCount = getConnectedUsersByRoom(roomId) -1; // -1 to account for the current disconnecting user
        io.emit('updateUserCount', { roomId, count: roomUserCount });
        console.log(`${user?.username} disconnected`);
        delete connectedUsers[socket.id]; // Remove user from connected users
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT} connect to chat at http://localhost:${PORT}`));
