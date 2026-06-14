import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Lösenord saknas' });
    }

    const PASSWORD_HASH = process.env.APP_PASSWORD_HASH;
    const JWT_SECRET = process.env.JWT_SECRET;

    try {
        const isMatch = await bcrypt.compare(password, PASSWORD_HASH);
        if (isMatch) {
            // Skapa en JWT token
            const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' });

            // Skapa en HttpOnly cookie
            const cookie = serialize('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 vecka
                path: '/'
            });

            res.setHeader('Set-Cookie', cookie);
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Fel lösenord' });
        }
    } catch (err) {
        console.error('Verify error:', err);
        return res.status(500).json({ error: 'Serverfel vid verifiering' });
    }
}
