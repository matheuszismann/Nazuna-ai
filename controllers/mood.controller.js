const { getTodayMood } = require("../config/mood");

function todayMoodController(req, res) {
    const mood = getTodayMood();

    return res.json({
        mood,
        date: new Date().toISOString().slice(0, 10)
    });
}

module.exports = { todayMoodController };
