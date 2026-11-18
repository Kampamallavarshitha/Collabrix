
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Database connection
const connectDB = require("./config/db");

// Load environment variables
dotenv.config({
    path: path.join(__dirname, ".env")
});

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "..")));

// Import routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/stats");

// API welcome route
app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Collabrix API!"
    });
});

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Public dashboard statistics
app.use("/api/stats", statsRoutes);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
            throw new Error(
                "MONGODB_URI and JWT_SECRET must be configured."
            );
        }

        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `Collabrix running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
}

startServer();
