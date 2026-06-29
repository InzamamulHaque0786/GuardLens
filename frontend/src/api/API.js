import axios from "axios"

const API = axios.create({
  baseURL: 'https://guardlens-v0cv.onrender.com/api',  // hosted backend url
  // baseURL: 'http://localhost:3000/api',  // local backend URL
  // baseURL: 'http://10.129.157.143:3000/api',  // Your backend URL
  withCredentials: true // http-only cookie will be sent with every request
});

export default API;