const Issue = require("../models/Issue");
const mongoose = require("mongoose");

// CREATE ISSUE
const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, location } = req.body;

    if (!location || location.lat == null || location.lng == null) {
      return res.status(400).json({ message: "Location is required" });
    }

    const issue = new Issue({
      title,
      description,
      category,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
      },
    });

    const created = await issue.save();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// GET ALL ISSUES
const getIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find();
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

// GET ISSUE BY ID
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

// UPDATE ISSUE
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

// DELETE ISSUE
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
    const { lat, lng, radius, category } = req.query;

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
          $maxDistance: parseInt(radius) || 2000, // default 2km
        },
      },
    };

    if (category) {
      query.category = category;
    }

    const issues = await Issue.find(query);

    res.json(issues);
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
};