const express = require("express");
const { chatController, clearChatContextController } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", chatController);
router.post("/context", clearChatContextController);

module.exports = router;
