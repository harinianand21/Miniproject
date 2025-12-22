const express = require("express");
const cors = require("cors");
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// in-memory storage for reports
const reports = [];

// test route
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

// report accessibility issue
app.post("/report", (req, res) => {
    const data = {
        ...req.body,
        timestamp: new Date().toISOString()
    };

    reports.push(data);
    console.log("Received and stored report:", data);

    res.json({
        message: "Accessibility issue reported successfully",
        received: data,
    });
});

// get all reports
app.get("/reports", (req, res) => {
    res.json(reports);
});

// start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
