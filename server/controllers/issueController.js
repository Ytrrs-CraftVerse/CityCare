const mongoose = require("mongoose");
const Issue = require("../models/Issue");

const createIssue = async (req, res, next) => {
  try {
    const { title, description, image, location, priority } = req.body;

    const similarCount = await Issue.countDocuments({
      title: { $regex: new RegExp(`^${title}$`, "i") },
      "location.lat": location.lat,
      "location.lng": location.lng,
    });

    const issue = await Issue.create({
      title,
      description,
      image,
      location,
      priority: typeof priority === "number" ? priority : 1 + similarCount,
    });

    return res.status(201).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    return next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const { status, sort } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "priority") sortOption = { priority: 1 };
    if (sort === "-priority") sortOption = { priority: -1 };
    if (sort === "date") sortOption = { createdAt: 1 };
    if (sort === "-date") sortOption = { createdAt: -1 };

    const issues = await Issue.find(filter).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    return next(error);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid issue ID");
      error.statusCode = 400;
      throw error;
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      const error = new Error("Issue not found");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    return next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid issue ID");
      error.statusCode = 400;
      throw error;
    }

    const updatePayload = {};
    if (status !== undefined) updatePayload.status = status;
    if (priority !== undefined) updatePayload.priority = priority;

    if (Object.keys(updatePayload).length === 0) {
      const error = new Error("Provide status or priority to update");
      error.statusCode = 400;
      throw error;
    }

    const issue = await Issue.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!issue) {
      const error = new Error("Issue not found");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid issue ID");
      error.statusCode = 400;
      throw error;
    }

    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      const error = new Error("Issue not found");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: issue,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
