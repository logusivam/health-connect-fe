import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  // Read token from the httpOnly cookie
  let token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const publicKey = Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('ascii');
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};