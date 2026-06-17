import handler from './api/analyze.js';
import fs from 'fs';

// Mock global fetch to bypass Firebase Auth
global.fetch = async (url, options) => {
    return {
        ok: true,
        json: async () => ({ users: [{ email: 'frebrandberg@gmail.com' }] })
    };
};

const req = {
    method: 'POST',
    headers: { authorization: 'Bearer dummy-token' },
    body: {
        files: [
            {
                data: fs.readFileSync('c:/dev/fynda/public/bidding.png').toString('base64'),
                mimeType: 'image/png'
            }
        ]
    }
};

const res = {
    status: (code) => ({
        json: (data) => console.log('Response:', code, data)
    })
};

(async () => {
    try {
        await handler(req, res);
    } catch (e) {
        console.error('Unhandled Error:', e);
    }
})();
