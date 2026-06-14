import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { db } from './_firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ error: 'Saknar id i söksträngen' });
    }

    try {
        const safeId = encodeURIComponent(id);
        const docRef = doc(db, "analyses", safeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return res.status(200).json({ found: true, data: docSnap.data() });
        } else {
            return res.status(200).json({ found: false });
        }
    } catch (err) {
        console.error("Firebase Get Error:", err);
        return res.status(500).json({ error: 'Kunde inte hämta från databasen', details: err.message });
    }
}
