// pages/api/set-cookie.js
import cookie from 'cookie';

export default function handler(req: any, res: { setHeader: (arg0: string, arg1: string) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) {
  // Set the cookie with SameSite=None and Secure=true
  res.setHeader('Set-Cookie', cookie.serialize('myCookie', 'cookieValue', {
    httpOnly: true, // Optional: Makes the cookie inaccessible to JavaScript
    secure: process.env.NODE_ENV === 'production', // Ensure Secure in production
    sameSite: 'none', // Required for cross-site requests
    maxAge: 60 * 60 * 24 * 7, // Optional: Set cookie expiration (7 days)
    path: '/', // Path where the cookie is available
    domain: process.env.NEXT_PUBLIC_SUPABASE_URL, // Optional: Domain to which the cookie belongs
  }));

  res.status(200).json({ message: 'Cookie set successfully' });
}
