import handler from './api/analyze.js';

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
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
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
