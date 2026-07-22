import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const authData = window.localStorage.getItem("smart-classroom-teacher-auth");

        if (authData) {
            try {
                const parsedAuth = JSON.parse(authData);

                if (parsedAuth?.token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${parsedAuth.token}`;
                }
            } catch {
                // Ignore invalid stored auth and continue without a token.
            }
        }
    }

    return config;
});

export default api;