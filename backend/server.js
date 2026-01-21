const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Manual .env loader
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value) process.env[key.trim()] = value.trim();
    });
}

const app = express();

// 1. Explicit CORS and OPTIONS handling
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173')) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());

// 6. Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] Incoming ${req.method} ${req.url}`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] Completed ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/accessibility_db";

// Connect to MongoDB
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false); // 5. Disable buffering
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err.message);
    });

// 4. Helper to check DB connection
const checkDB = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: "Database temporary unavailable",
            message: "The server is running but is currently disconnected from the database."
        });
    }
    next();
};

const pointSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    // feature type (e.g., ramp, tactile, etc.)
    featureType: { type: String, required: true },
    notes: { type: String },
    // enriched data fields
    placeName: { type: String },
    title: { type: String },
    description: { type: String },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Template definitions for each feature type (Description only, Titles moved to Place Name)
const featureTemplates = {
    ramp: {
        label: "Wheelchair Ramp",
        description: (place) => `A wheelchair-accessible ramp is available near ${place}, improving access for mobility-impaired users.`
    },
    elevator: {
        label: "Elevator",
        description: (place) => `An operational elevator is available at ${place} for multi-level access.`
    },
    bathroom: {
        label: "Accessible Restroom",
        description: (place) => `A public accessible restroom is available near ${place}.`
    },
    parking: {
        label: "Disabled Parking",
        description: (place) => `Designated disabled parking spots are available near ${place}.`
    },
    braille: {
        label: "Braille Guidance",
        description: (place) => `Tactile site map and Braille directory available at ${place}.`
    },
    audio: {
        label: "Audio Guidance",
        description: (place) => `Beacon-based audio announcements for visually impaired travelers near ${place}.`
    },
    tactile: {
        label: "Tactile Paving",
        description: (place) => `Clean tactile paving along the primary pedestrian stretch at ${place}.`
    },
    stairs: {
        label: "Steep Stairs",
        description: (place) => `Note: Steep stairs or potential obstacle reported at ${place}.`
    },
    obstacle: {
        label: "Obstacle",
        description: (place) => `Warning: An obstacle is blocking the accessible path near ${place}.`
    }
};

// Helper to reverse‑geocode using Nominatim
// Helper to reverse‑geocode using Nominatim with human‑readable priority
async function reverseGeocode(lat, lng, zoom = 18) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=${zoom}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'miniproject-app' } });
        if (!res.ok) return null;
        const data = await res.json();

        if (!data || !data.address) {
            // If failed at high zoom, retry with broader zoom once
            if (zoom > 14) return reverseGeocode(lat, lng, zoom - 2);
            return null;
        }

        const addr = data.address || {};

        // 1. EXTRACT LANDMARK/POI (STRICT PRIORITY)
        const landmark = addr.name || addr.park || addr.leisure || addr.amenity || addr.tourism || addr.shop || addr.building;

        // 2. EXTRACT AREA/LOCALITY
        const road = addr.road || addr.pedestrian;
        const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district;
        const area = neighborhood || road;

        // 3. COMPOSE HUMAN-READABLE NAME (e.g. "Anna Nagar Tower Park")
        let finalLabel = "";
        if (landmark && area && !landmark.includes(area)) {
            finalLabel = `${area} ${landmark}`;
        } else {
            finalLabel = landmark || area || addr.city || addr.state || data.display_name.split(',')[0];
        }

        return {
            fullName: data.display_name,
            shortLabel: finalLabel.trim()
        };
    } catch (e) {
        console.error('Reverse geocode error:', e);
        return null;
    }
}

app.post("/points", checkDB, async (req, res, next) => {
    try {
        const { latitude, longitude, type, notes, placeName: incomingPlaceName } = req.body;
        if (latitude === undefined || longitude === undefined || !type) {
            return res.status(400).json({ error: "Missing required fields: latitude, longitude, or type" });
        }

        let addressInfo = null;
        let placeLabel = "";
        let fullPlaceName = "";

        if (incomingPlaceName) {
            fullPlaceName = incomingPlaceName;
            const parts = incomingPlaceName.split(',').map(p => p.trim());
            const landmark = parts[0];
            const area = parts[1] || "";

            // Build a human-readable label (e.g. "Anna Nagar Tower Park")
            if (landmark && area && !landmark.toLowerCase().includes(area.toLowerCase()) && !area.toLowerCase().includes(landmark.toLowerCase())) {
                placeLabel = `${area} ${landmark}`;
            } else {
                placeLabel = landmark;
            }
        } else {
            addressInfo = await reverseGeocode(Number(latitude), Number(longitude));
            placeLabel = addressInfo ? addressInfo.shortLabel : "Location Near Coordinates";
            fullPlaceName = addressInfo ? addressInfo.fullName : "Unknown Location";
        }

        // Determine template based on feature type for description
        const tmpl = featureTemplates[type] || {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            description: (p) => `Accessibility report for ${p}.`
        };

        const generatedDescription = tmpl.description(placeLabel);

        const point = new Point({
            latitude: Number(latitude),
            longitude: Number(longitude),
            featureType: type,
            notes: notes || "",
            placeName: placeLabel, // Short human-readable name
            title: placeLabel,     // Match placeName for card heading
            description: generatedDescription
        });
        await point.save();
        res.status(201).json(point);
    } catch (err) {
        next(err);
    }
});

const Point = mongoose.model("Point", pointSchema);

// 3. Routes wrapped in try/catch and structured JSON
app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Accessibility API is running",
        db_connected: mongoose.connection.readyState === 1
    });
});

app.get("/points", checkDB, async (req, res, next) => {
    try {
        const points = await Point.find().sort({ createdAt: -1 }).lean().maxTimeMS(5000);
        res.status(200).json(points);
    } catch (err) {
        next(err);
    }
});

app.post("/points", checkDB, async (req, res, next) => {
    try {
        const { latitude, longitude, type, notes } = req.body;

        if (latitude === undefined || longitude === undefined || !type) {
            return res.status(400).json({ error: "Missing required fields: latitude, longitude, or type" });
        }

        const point = new Point({
            latitude: Number(latitude),
            longitude: Number(longitude),
            type,
            notes: notes || ""
        });

        await point.save();
        res.status(201).json(point);
    } catch (err) {
        next(err);
    }
});

app.patch("/points/:id/vote", checkDB, async (req, res, next) => {
    try {
        const { voteType } = req.body;
        const update = voteType === 'upvote'
            ? { $inc: { upvotes: 1 } }
            : { $inc: { downvotes: 1 } };

        const updatedPoint = await Point.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).lean();

        if (!updatedPoint) return res.status(404).json({ error: "Point not found" });
        res.status(200).json(updatedPoint);
    } catch (err) {
        next(err);
    }
});

// 2. Global Express error-handling middleware
app.use((err, req, res, next) => {
    console.error(`[INTERNAL ERROR] ${err.stack}`);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
});


