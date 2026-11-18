
const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");

// Get all projects belonging to the logged-in user
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            userId: req.userId
        })
            .populate("assignedBy", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
            error: error.message
        });
    }
};

// Create a new project
const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            assignedBy,
            createdBy,
            deadline
        } = req.body;

        if (!name || !assignedBy || !createdBy || !deadline) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required project details."
            });
        }

        const assignedUser = await User.findById(assignedBy);
        const createdUser = await User.findById(createdBy);

        if (!assignedUser || !createdUser) {
            return res.status(400).json({
                success: false,
                message: "Assigned By or Created By user does not exist."
            });
        }

        const project = await Project.create({
            name,
            description,
            assignedBy,
            createdBy,
            deadline,
            userId: req.userId
        });

        const savedProject = await Project.findById(project._id)
            .populate("assignedBy", "name email")
            .populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: savedProject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create project",
            error: error.message
        });
    }
};

// Update an existing project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            assignedBy,
            createdBy,
            deadline
        } = req.body;

        const project = await Project.findOne({
            _id: id,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (!name || !assignedBy || !createdBy || !deadline) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required project details."
            });
        }

        const assignedUser = await User.findById(assignedBy);
        const createdUser = await User.findById(createdBy);

        if (!assignedUser || !createdUser) {
            return res.status(400).json({
                success: false,
                message: "Assigned By or Created By user does not exist."
            });
        }

        project.name = name;
        project.description = description || "";
        project.assignedBy = assignedBy;
        project.createdBy = createdBy;
        project.deadline = deadline;

        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate("assignedBy", "name email")
            .populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update project",
            error: error.message
        });
    }
};

// Delete a project and its associated tasks
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        await Task.deleteMany({
            projectId: project._id,
            userId: req.userId
        });

        res.status(200).json({
            success: true,
            message: "Project and its associated tasks deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: error.message
        });
    }
};

module.exports = {
    getProjects,
    createProject,
    updateProject,
    deleteProject
};
