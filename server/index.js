const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Issue = require('./models/Issue');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/issues', upload.single('image'), async (req, res) => {
  const { type, description, lat, lng, userName } = req.body;
  const issue = new Issue({
    type,
    description,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    },
    image: req.file ? `/uploads/${req.file.filename}` : null,
    userName,
  });

  try {
    const newIssue = await issue.save();
    res.status(201).json(newIssue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const total = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'Resolved' });
    const byType = await Issue.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    res.json({ total, resolved, byType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (req.body.status) issue.status = req.body.status;
    const updatedIssue = await issue.save();
    res.json(updatedIssue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
