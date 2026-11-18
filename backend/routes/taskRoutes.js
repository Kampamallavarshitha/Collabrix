
const express = require("express");
const router = express.Router();

const {
    getTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

module.exports = router;
