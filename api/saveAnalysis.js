import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { db } from './_firebase.js';
import { doc, setDoc } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Läs och validera JWT
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Obehörig - logga in först' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Ogiltig session' });
    }

    const { id, data } = req.body;
    
    if (!id || !data) {
        return res.status(400).json({ error: 'Saknar id eller data' });
    }

    try {
        // Eftersom Vercel/Firestore ibland inte gillar otillåtna tecken i ID, url-kodar vi det om det är en URL
        const safeId = encodeURIComponent(id);
        
        await setDoc(doc(db, "analyses", safeId), data);
        
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Firebase Save Error:", err);
        return res.status(500).json({ error: 'Kunde inte spara i databasen' });
    }
}
