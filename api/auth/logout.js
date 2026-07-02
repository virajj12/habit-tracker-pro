import * as cookie from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Clear the cookie by setting maxAge to -1
  const serialized = cookie.serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  });

  res.setHeader('Set-Cookie', serialized);
  res.status(200).json({ message: 'Logged out successfully' });
}
