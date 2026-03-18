const jwtConfig = {
  secret: process.env.JWT_SECRET || 'worksy-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = jwtConfig;
