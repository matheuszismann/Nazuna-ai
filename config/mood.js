const MOODS = [
    {
        id: "lazy",
        title: "Com preguiça",
        description: "Acordei tarde e hoje prefiro papos mais curtos.",
        react: "😴",
        color: "#9d7cff"
    },
    {
        id: "tsundere",
        title: "Irritadiça",
        description: "Estou meio implicante hoje... mas ainda vou te responder.",
        react: "🙄",
        color: "#ff8fa3"
    },
    {
        id: "happy",
        title: "De bom humor",
        description: "Estou curiosa e com vontade de conversar!",
        react: "✨",
        color: "#ffd166"
    },
    {
        id: "sleepy",
        title: "Sonolenta",
        description: "Respostas mais tranquilas, com alguns bocejos pelo caminho.",
        react: "🌙",
        color: "#78a9ff"
    }
];

function getTodayMood(date = new Date()) {
    const dayHash = date.getFullYear() * 10000
        + (date.getMonth() + 1) * 100
        + date.getDate();

    return MOODS[dayHash % MOODS.length];
}

module.exports = { MOODS, getTodayMood };
