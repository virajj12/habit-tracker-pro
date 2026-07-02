import dbConnect from '../_utils/dbConnect.js';
import Category from '../_models/Category.js';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  let userId;
  try {
    const cookies = cookie.parseCookie(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) throw new Error('Not authenticated');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const categories = await Category.find({ userId }).sort({ createdAt: 1 });
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      const newCategory = await Category.create({ name, userId });
      res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Category already exists' });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
