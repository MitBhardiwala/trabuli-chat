// pages/api/proxy/[...path].js

import axios from 'axios';

export default async function handler(req, res) {
    const { path } = req.query;
    const apiUrl = `http://3.109.143.238:3000/trabuli/${path.join('/')}`;

    try {
        const response = await axios({
            method: req.method,
            url: apiUrl,
            data: req.body,
            headers: {
                ...req.headers,
                host: new URL(apiUrl).host,
            },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'An error occurred' });
    }
}