import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Decode base64 public key
    const publicKey = Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('ascii');
    
    // Verify token using RS256
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};