const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Server error',
  });
};

module.exports = { notFound, errorHandler };
