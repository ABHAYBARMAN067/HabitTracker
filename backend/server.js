const mongoose = require('mongoose');
const dotenv = require('dotenv');
const createApp = require('./app');

dotenv.config();
const dns = require('dns');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = createApp();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/habit-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(error => console.error('MongoDB connection failed:', error.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
