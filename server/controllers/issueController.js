const Issue = require("../models/Issue");
const mongoose = require("mongoose");

const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, location } = req.body;

    if (!location || location.lat == null || location.lng == null) {
      return res.status(400).json({ message: "Location is required" });
    }

    const nearbyCount = await Issue.countDocuments({
      category,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.lng, location.lat],
          },
          $maxDistance: 1000,
        },
      },
    });

    let basePriority = 1;
    if (category === "pothole") basePriority = 3;
    if (category === "water") basePriority = 4;
    if (category === "garbage") basePriority = 2;

    const priority = basePriority + nearbyCount;

    const issue = new Issue({
      title,
      description,
      category,
      priority,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
      },
      reportedBy: req.user._id,
    });

    const created = await issue.save();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find();
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json({ message: "Issue deleted" });
  } catch (err) {
    next(err);
  }
};

const getNearbyIssues = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, status } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat & lng required" });
    }

    let query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius) || 2000,
        },
      },
    };

    if (category) query.category = category;
    if (status) query.status = status;

    const issues = await Issue.find(query);
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

const getTrendingIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find().sort({ priority: -1 }).limit(5);
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id });
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

const upvoteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.upvotes += 1;
    await issue.save();

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.comments.push({
      text,
      user: req.user._id,
    });

    await issue.save();

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getNearbyIssues,
  getTrendingIssues,
  updateStatus,
  getStats,
  getMyIssues,
  upvoteIssue,
  addComment,
};