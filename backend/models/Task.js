
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },

        status: {
            type: String,
            enum: ["To Do", "In Progress", "Completed"],
            default: "To Do"
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Validate that the end date is not before the start date.
taskSchema.pre("validate", function () {
    if (
        this.startDate &&
        this.endDate &&
        this.endDate < this.startDate
    ) {
        this.invalidate(
            "endDate",
            "End date cannot be before start date."
        );
    }
});

module.exports = mongoose.model("Task", taskSchema);
