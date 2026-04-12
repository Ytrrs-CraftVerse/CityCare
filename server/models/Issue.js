const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const issueSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    priority: Number,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },

    status: {
      type: String,
      enum: ["reported", "in-progress", "resolved"],
      default: "reported",
    },

    upvotes: { type: Number, default: 0 },
    comments: [commentSchema],

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

issueSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Issue", issueSchema);