const validateIssueCreate = (req, res, next) => {
  const { title, description, location } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({
      success: false,
      message: "title, description, and location are required",
    });
  }

  if (
    typeof location.lat !== "number" ||
    typeof location.lng !== "number" ||
    Number.isNaN(location.lat) ||
    Number.isNaN(location.lng)
  ) {
    return res.status(400).json({
      success: false,
      message: "location.lat and location.lng must be valid numbers",
    });
  }

  return next();
};

const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

module.exports = {
  validateIssueCreate,
  notFound,
  errorHandler,
};
