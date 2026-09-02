const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const legacyToken = req.header('x-auth-token') || req.cookies?.token;
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = legacyToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret-change-me' : null);
    if (!jwtSecret) return res.status(500).json({ msg: 'Server authentication is not configured' });
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
