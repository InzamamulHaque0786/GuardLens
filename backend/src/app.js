import express from 'express'
import cookieParser from 'cookie-parser'
import authRoute from '../src/routes/auth.route.js'
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:['GET', 'POST', 'PUT', 'DELETE']
}))

app.use('/api/auth',authRoute)

export default app;