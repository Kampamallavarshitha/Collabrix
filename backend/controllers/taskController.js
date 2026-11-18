
const mongoose = require("mongoose");

const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

// =====================================
// 1. VALIDATE TASK DATES
// =====================================

const validateDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        !startDate ||
        !endDate ||
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return "Please provide valid start and end dates.";
    }

    if (end < start) {
        return "End date cannot be before start date.";
    }

    return null;
};


// =====================================
// 2. VALIDATE TASK DATA
// =====================================

const validateTaskData = async (data, userId) => {
    const {
        name,
        assignedTo,
        projectId,
        startDate,
        endDate,
        priority,
        status
    } = data;

    if (!name || !assignedTo || !startDate || !endDate) {
        return "Please provide all required task details.";
    }

    const dateError = validateDates(startDate, endDate);

    if (dateError) {
        return dateError;
    }

    const validPriorities = ["Low", "Medium", "High"];

    const validStatuses = [
        "To Do",
        "In Progress",
        "Completed"
    ];

    if (priority && !validPriorities.includes(priority)) {
        return "Invalid task priority.";
    }

    if (status && !validStatuses.includes(status)) {
        return "Invalid task status.";
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return "Invalid assigned user.";
    }

    const assignedUser = await User.findById(assignedTo);

    if (!assignedUser) {
        return "Assigned user does not exist.";
    }

    if (projectId) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return "Invalid project.";
        }

        const project = await Project.findOne({
            _id: projectId,
            userId
        });

        if (!project) {
            return "Selected project does not exist in your workspace.";
        }
    }

    return null;
};


// =====================================
// 3. GET ALL TASKS
// =====================================

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.userId
        })
            .populate("assignedTo", "name email")
            .populate("projectId", "name deadline")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
};


// =====================================
// 4. CREATE TASK
// =====================================

const createTask = async (req, res) => {
    try {
        const {
            name,
            description,
            assignedTo,
            projectId,
            startDate,
            endDate,
            priority,
            status
        } = req.body;

        const validationError = await validateTaskData(
            req.body,
            req.userId
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const task = await Task.create({
            name,
            description: description || "",
            assignedTo,
            projectId: projectId || null,
            startDate,
            endDate,
            priority: priority || "Medium",
            status: status || "To Do",
            userId: req.userId
        });

        const savedTask = await Task.findById(task._id)
            .populate("assignedTo", "name email")
            .populate("projectId", "name deadline");

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: savedTask
        });

    } catch (error) {
        console.error("Create task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create task",
            error: error.message
        });
    }
};


// =====================================
// 5. UPDATE COMPLETE TASK
// =====================================

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        const task = await Task.findOne({
            _id: id,
            userId: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        const validationError = await validateTaskData(
            req.body,
            req.userId
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        task.name = req.body.name;
        task.description = req.body.description || "";
        task.assignedTo = req.body.assignedTo;
        task.projectId = req.body.projectId || null;
        task.startDate = req.body.startDate;
        task.endDate = req.body.endDate;
        task.priority = req.body.priority || "Medium";
        task.status = req.body.status || "To Do";

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate("assignedTo", "name email")
            .populate("projectId", "name deadline");

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        });

    } catch (error) {
        console.error("Update task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update task",
            error: error.message
        });
    }
};


// =====================================
// 6. UPDATE TASK STATUS
// KANBAN DRAG AND DROP
// =====================================

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate MongoDB task ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        // Allow only these three statuses
        const validStatuses = [
            "To Do",
            "In Progress",
            "Completed"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status."
            });
        }

        // Update the task directly in MongoDB
        const task = await Task.findOneAndUpdate(
            {
                _id: id,
                userId: req.userId
            },
            {
                $set: {
                    status: status
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("assignedTo", "name email")
            .populate("projectId", "name deadline");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        console.log(
            `Task ${task._id} status saved in MongoDB: ${task.status}`
        );

        res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            task: task
        });

    } catch (error) {
        console.error("MongoDB task status update error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update task status",
            error: error.message
        });
    }
};


// =====================================
// 7. DELETE TASK
// =====================================

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        const task = await Task.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task",
            error: error.message
        });
    }
};


// =====================================
// 8. EXPORT CONTROLLERS
// =====================================

module.exports = {
    getTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
};
