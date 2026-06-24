import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/db/db.js';

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed! Server shutdown.", error);
    });