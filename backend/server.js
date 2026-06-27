import 'dotenv/config';
import { server } from './src/app.js'; 
import connectDB from './src/db/db.js';

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running on port ${process.env.PORT || 5000} with WebSockets enabled`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed! Server shutdown.", error);
    });