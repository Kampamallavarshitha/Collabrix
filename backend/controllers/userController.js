
const User = require("../models/User");

// Get registered users for workspace dropdowns
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("_id name email")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

module.exports = {
    getUsers
};
