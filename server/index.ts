import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Issue, { IIssue } from './models/Issue';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists for image storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Config for Image Uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, 'uploads/'),
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/citycare';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

/**
 * FEATURE: Public Dashboard (Fetch All Issues)
 */
app.get('/api/issues', async (req: Request, res: Response) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * FEATURE: Issue Reporting (Create with Image Upload)
 */
app.post('/api/issues', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { type, description, lat, lng, userName } = req.body;
    const issue = new Issue({
      type,
      description,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      image: req.file ? `/uploads/${req.file.filename}` : null,
      userName,
    });
    const savedIssue = await issue.save();
    res.status(201).json(savedIssue);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * FEATURE: Real-time Stats & Hotspots
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const total = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'Resolved' });
    const inProgress = await Issue.countDocuments({ status: 'In Progress' });
    
    // Calculate resolution rate
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(2) : 0;

    // Identify hotspots (Group by type)
    const hotspots = await Issue.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ 
      total, 
      resolved, 
      inProgress, 
      resolutionRate: `${resolutionRate}%`,
      hotspots 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Update Issue Status
 */
app.patch('/api/issues/:id', async (req: Request, res: Response) => {
  try {
    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json(updatedIssue);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
