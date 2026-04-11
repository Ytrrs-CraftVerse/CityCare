const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Pothole', 'Streetlight', 'Garbage', 'Water Leak', 'Other'],
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  image: {
    type: String, // URL/Path to the image
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported',
  },
  userName: {
    type: String,
    default: 'Anonymous',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Issue', issueSchema);
