// routes/stats.js  – PUBLIC route (no login needed)
// Adjust the two require() paths to match your project.

const express = require("express");
const router = express.Router();

const Project = require("../models/Project");
const Task = require("../models/Task");

router.get("/", async (req, res) => {
    try {
        const [projects, tasks] = await Promise.all([
            Project.find({}, "_id").lean(),
            Task.find({}, "projectId status priority").lean()
        ]);

        const finishedProjects = projects.filter(function (project) {
            const own = tasks.filter(function (task) {
                return String(task.projectId) === String(project._id);
            });

            return own.length > 0 && own.every(function (task) {
                return task.status === "Completed";
            });
        }).length;

        const todo = tasks.filter(function (task) {
            return task.status === "To Do";
        });

        res.json({
            stats: {
                totalProjects: projects.length,
                finishedProjects: finishedProjects,
                todoTasks: todo.length,
                highPriorityTasks: todo.filter(function (task) {
                    return task.priority === "High";
                }).length
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Could not load stats." });
    }
});

module.exports = router;