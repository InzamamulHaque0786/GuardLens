import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import http from 'http'; //for socket.io
import { Server } from 'socket.io'; //for socket.io

import authRoute from '../src/routes/auth.route.js'
import crimeRoute from '../src/routes/crime.route.js'
import aiRoute from '../src/routes/ai.route.js'
import broadcastRoute from '../src/routes/broadcast.route.js'
import userRoute from '../src/routes/user.route.js';
import adminDashboard from '../src/routes/dashboard.route.js'
import sosRoute from '../src/routes/sos.route.js';

const app = express()
const server = http.createServer(app);//for socket.io

// NEW: Initialize Socket.io with the exact same CORS settings as your Express app
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", 'http://10.129.157.143:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
    }
});

// NEW: Inject 'io' into the request object for your controllers to use
app.use((req, res, next) => {
    req.io = io;
    next();
});

// NEW: Listen for real-time connections
io.on('connection', (socket) => {
    console.log('A user connected to real-time alerts:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:["http://localhost:5173",'http://10.129.157.143:5173'],
    credentials:true,
    methods:['GET', 'POST', 'PUT', 'DELETE','PATCH']
}))

app.use('/api/auth',authRoute)
app.use('/api/crime',crimeRoute)
app.use('/api/ai',aiRoute)
app.use('/api/broadcast', broadcastRoute);
app.use('/api/user', userRoute);
app.use('/api/dashboard', adminDashboard);
app.use('/api/sos', sosRoute);



export {app,server};