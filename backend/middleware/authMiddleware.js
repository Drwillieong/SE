import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('verifyToken middleware called, authHeader:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Access token required');
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
