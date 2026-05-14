const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const fs = require('fs');
const errorHandler = require('./middleware/error');
const auth = require('./routes/auth');
const tasks = require('./routes/tasks');
const upload = require('./routes/upload');
const labels = require('./routes/labels');

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static folder
app.use('/uploads', express.static('uploads'));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/tasks', tasks);
app.use('/api/upload', upload);
app.use('/api/labels', labels);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Error Handler (Must be last)
app.use(errorHandler);

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/todoapp';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
