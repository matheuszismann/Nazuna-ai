const { getTodayMood } = require("../config/mood");
const { generateResponse } = require("../ai/gemini");
const { parseNazunaResponse } = require("../parsers/nazuna.parser");
const { applyLearning, buildMemoryContext } = require("../memory/memory.store");
const { nazunaInstructions } = require("../prompts/nazuna.instructions");

async function chatController(req, res) {
    try {
        const { message, userId } = req.body;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Mensagem inválida." });
        }

        if (typeof userId !== "string" || !/^[a-f0-9-]{36}$/i.test(userId.trim())) {
            return res.status(400).json({ error: "User ID inválido." });
        }

        const cleanMessage = message.trim();
        const cleanUserId = userId.trim();
        const mood = getTodayMood();
        const memoryContext = await buildMemoryContext(cleanUserId);

        const instructions = [
            nazunaInstructions,
            "",
            "MOOD DO DIA — siga este estado de forma sutil, sem anunciar a regra:",
            `Humor: ${mood.title}. ${mood.description}`,
            "",
            "MEMÓRIA PERSISTENTE DO USUÁRIO",
            memoryContext,
            "Use essas informações somente quando forem relevantes.",
            "Não invente memórias que não estejam presentes."
        ].join("\n");

        const rawResponse = await generateResponse(cleanMessage, instructions);
        const nazuna = parseNazunaResponse(rawResponse);

        if (!nazuna) {
            return res.status(500).json({ error: "Resposta da IA inválida." });
        }

        let memoryResult = null;
        if (nazuna.aprender) {
            memoryResult = await applyLearning(cleanUserId, nazuna.aprender);
        }

        return res.json({
            response: nazuna.response,
            aprender: nazuna.aprender,
            mood,
            memory: memoryResult ? {
                success: memoryResult.success,
                action: memoryResult.action || null,
                reason: memoryResult.reason || null
            } : null
        });
    } catch (error) {
        console.error("❌ [CHAT] Erro no processamento:", error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
}

module.exports = { chatController };
