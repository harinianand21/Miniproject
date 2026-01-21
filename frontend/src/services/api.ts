import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:5001",
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Log every request for debugging
api.interceptors.request.use(config => {
    console.log(`[API START] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
}, error => {
    console.error(`[API REQUEST ERROR]`, error);
    return Promise.reject(error);
});

// Enhance error handling to extract server messages
api.interceptors.response.use(
    response => {
        console.log(`[API SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        return response;
    },
    error => {
        if (error.response) {
            console.error(`[API SERVER ERROR] ${error.response.status} ${error.config?.url}:`, error.response.data);
        } else if (error.request) {
            console.error(`[API NETWORK ERROR] No response from ${error.config?.url}. Check if the backend is running on port 5001.`);
        } else {
            console.error(`[API SETUP ERROR]`, error.message);
        }
        return Promise.reject(error);
    }
);
