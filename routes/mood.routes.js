const express = require("express");
const { todayMoodController } = require("../controllers/mood.controller");

const router = express.Router();
router.get("/today", todayMoodController);

module.exports = router;
