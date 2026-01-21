const mongoose = require('mongoose');
const MONGO_URI = "mongodb://localhost:27017/accessibility_db";

console.log("Connecting to:", MONGO_URI);
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
        console.log("SUCCESS: Connected to MongoDB");
        process.exit(0);
    })
    .catch(err => {
        console.error("FAILURE: Could not connect to MongoDB:", err.message);
        process.exit(1);
    });
