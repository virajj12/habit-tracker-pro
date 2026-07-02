import dbConnect from '../_utils/dbConnect.js';
import User from '../_models/User.js';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const cookies = cookie.parseCookie(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
    
    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.method === 'GET') {
      res.status(200).json(user);
    } else if (req.method === 'PUT') {
      // Allow updating xp, level, streakTokens
      const { xp, level, streakTokens } = req.body;
      if (xp !== undefined) user.xp = xp;
      if (level !== undefined) user.level = level;
      if (streakTokens !== undefined) user.streakTokens = streakTokens;
      
      await user.save();
      res.status(200).json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token' });
  }
}
