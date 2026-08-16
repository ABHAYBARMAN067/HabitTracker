const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const legacyToken = req.header('x-auth-token') || req.cookies?.token;
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = legacyToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-change-me');
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
