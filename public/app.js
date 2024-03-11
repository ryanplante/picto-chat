var socket = io();
document.getElementById('setUsernameBtn').addEventListener('click', function() {
    var newUsername = prompt("Enter your new username:");
    if (newUsername) {
        socket.emit('setUsername', { newUsername: newUsername });
    }
});

socket.on('usernameSet', (newUsername) => {
    var justArrived = document.getElementById('usernameDisplay').textContent === `Welcome, `
    document.getElementById('usernameDisplay').textContent = `Welcome, ${newUsername}`;
    localStorage.setItem('username', newUsername);
    if (!justArrived) {
        alert("Username changed successfully!");
    }
});

socket.on('usernameTaken', ({ message }) => {
    alert(message);
    // Prompt the user to choose a different username, or handle as appropriate
});


socket.on('updateUserCount', ({ roomId, count }) => {
    const roomElement = document.querySelector(`.roomLink[data-roomid="${roomId}"] .userCount`);
    console.log(`roomId:${roomId}\tcount${count}`);
    if (roomElement) {
        roomElement.textContent = `${count}/10`;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Request the current username from storage
    const newUsername = localStorage.getItem('username') || 'guest'
    socket.emit('setUsernameNew', { newUsername });
    socket.emit('getUserCount');
     // Fallback to 'Guest-1234' if not set
    //socket.emit('getUsername');
});
