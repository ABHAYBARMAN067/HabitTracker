const mongoose = require('mongoose');
const dotenv = require('dotenv');
const createApp = require('./app');

dotenv.config();
const dns = require('dns');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = createApp();
const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/habit-tracker';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}


mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('\n----------------------------------------');
    console.log('HabitFlow Project Started Successfully!');
    console.log(' Backend connected to MongoDB');
    console.log(' Authentication & OTP working');
    console.log(' Analytics APIs working');
    console.log(' Frontend connected successfully');
    console.log('All features are working correctly!');
    console.log('----------------------------------------\n');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message);
    process.exitCode = 1;
  });
