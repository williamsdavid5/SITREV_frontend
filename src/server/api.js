import axios from "axios";

const api = axios.create({
    baseURL: "https://telemetria-fvv4.onrender.com",
});

export default api;