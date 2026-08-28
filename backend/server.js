const mongoose = require('mongoose');
const dotenv = require('dotenv');
const createApp = require('./app');

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(error => console.error('MongoDB connection failed:', error.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
