var socket = io();
var username = localStorage.getItem('username') || 'Guest-1234'; // Fallback to 'Guest-1234' if not set
var messageType = document.getElementById('messageType');
var form = document.getElementById('message-form');
var input = document.getElementById('m');
var canvas = document.getElementById('drawing-canvas');
var context = canvas.getContext('2d');
var drawing = false;
var urlParams = new URLSearchParams(window.location.search);
var roomId = urlParams.get('roomId') || '1'; // Default to '1' if roomId is not specified in the URL


// Listen for the username update from the server
socket.on('usernameUpdated', function(updatedUsername) {
    username = updatedUsername
    document.getElementById('usernameDisplay').textContent = updatedUsername;
    localStorage.setItem('username', newUsername);
});


// Emit join room event with roomId when the page loads
socket.emit('joinRoom', { username, roomId });

// Username display and change functionality
document.getElementById('usernameDisplay').addEventListener('click', function() {
    var newUsername = prompt('Enter your new username:', username);
    if(newUsername) {
        username = newUsername;
        this.textContent = username;
        socket.emit('changeUsername', { newUsername, id: socket.id });
    }
});

// Message type selection handling
messageType.addEventListener('change', function() {
    if(this.value === 'text') {
        canvas.style.display = 'none';
        input.style.display = 'block';
    } else {
        input.style.display = 'none';
        canvas.style.display = 'block';
    }
});

// Form submission for text and drawing messages
form.addEventListener('submit', function(e) {
    let blob
    e.preventDefault();
    if(messageType.value === 'text' && input.value) {
        blob = { type: 'text', content: input.value, author: username, roomId: roomId }
        input.value = ''; // Clear the text input
    } else if(messageType.value === 'drawing') {
        var dataURL = canvas.toDataURL('image/png');
        blob = { type: 'drawing', content: dataURL, author: username, roomId: roomId }
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    }
    addMessageToChatHistory(blob)
    socket.emit('chatMessage', blob)
});

document.getElementById('clearBtn').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the default button click behavior
    if(messageType.value === 'text') {
        input.value = ''; // Clear the text input
    } else if(messageType.value === 'drawing') {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    }
});

// Drawing functionality
canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    context.beginPath();
    context.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', function(e) {
    if(drawing) {
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
    }
});

canvas.addEventListener('mouseup', function() {
    drawing = false;
});

// Handling incoming messages and chat history
function addMessageToChatHistory(msg) {
    var messageElement;
    if(msg.type === 'text') {
        messageElement = document.createElement('p');
        messageElement.textContent = msg.author + ": " + msg.content;
    } else if(msg.type === 'drawing') {
        // Create a container for the image and the author's name
        messageElement = document.createElement('div');

        // Add the author's name
        var authorName = document.createElement('p');
        authorName.textContent = msg.author;
        messageElement.appendChild(authorName);

        // Add the image
        var imageElement = new Image();
        imageElement.src = msg.content;
        imageElement.alt = 'Drawing by ' + msg.author;
        messageElement.appendChild(imageElement);
    }
    document.getElementById('chat-history').appendChild(messageElement);
}

function addMessageToChatHistoryAndDing(msg) {
    var sound = document.getElementById('alertSound');
    sound.play();
    addMessageToChatHistory(msg);
}

socket.on('loadHistory', function(history) {
    history.forEach(addMessageToChatHistory);
});

socket.on('newMessage', function(msg){
    addMessageToChatHistoryAndDing(msg);
});

document.addEventListener('DOMContentLoaded', function() {
     socket.emit('getUsername');
});