const mongoose = require('mongoose');

const connectionURL = 'mongodb://127.0.0.1:27017/chat-app';

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
