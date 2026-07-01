export default function handler(req, res) {
    res.status(200).json({
        gemini: !!process.env.GEMINI_API_KEY,
        hash: !!process.env.APP_PASSWORD_HASH,
        firebase: !!process.env.VITE_FIREBASE_API_KEY
    });
}
