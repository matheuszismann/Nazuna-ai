const { getTodayMood } = require("../config/mood");
const { generateResponse } = require("../ai/gemini");
const { parseNazunaResponse } = require("../parsers/nazuna.parser");
const {
    applyLearning,
    buildMemoryContext,
    saveContextMessages,
    clearContext
} = require("../memory/memory.store");
const { nazunaInstructions } = require("../prompts/nazuna.instructions");

function validUserId(userId) {
    return typeof userId === "string" && /^[a-f0-9-]{36}$/i.test(userId.trim());
}

async function chatController(req, res) {
    try {
        const { message, userId } = req.body;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Mensagem inválida." });
        }
        if (!validUserId(userId)) {
            return res.status(400).json({ error: "User ID inválido." });
        }

        const cleanMessage = message.trim();
        const cleanUserId = userId.trim();
        const mood = getTodayMood();
        const memoryContext = await buildMemoryContext(cleanUserId);

        await saveContextMessages(cleanUserId, [{ role: "user", content: cleanMessage }]);

        const instructions = [
            nazunaInstructions,
            "",
            "MOOD DO DIA — siga este estado de forma sutil, sem anunciar a regra:",
            `Humor: ${mood.title}. ${mood.description}`,
            "",
            "MEMÓRIA E CONTEXTO PERSISTENTE DO USUÁRIO",
            memoryContext,
            "Use essas informações somente quando forem relevantes.",
            "Não invente memórias que não estejam presentes."
        ].join("\n");

        const rawResponse = await generateResponse(cleanMessage, instructions);
        const nazuna = parseNazunaResponse(rawResponse);

        if (!nazuna) return res.status(500).json({ error: "Resposta da IA inválida." });

        const assistantText = nazuna.response
            .map(item => item.resp)
            .filter(Boolean)
            .join("\n");
        await saveContextMessages(cleanUserId, [{ role: "assistant", content: assistantText }]);

        let memoryResult = null;
        if (nazuna.aprender) memoryResult = await applyLearning(cleanUserId, nazuna.aprender);

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

async function clearChatContextController(req, res) {
    try {
        const { userId, action } = req.body;
        if (!validUserId(userId)) return res.status(400).json({ error: "User ID inválido." });
        if (String(action).toLowerCase() !== "remover") {
            return res.status(400).json({ error: "Ação inválida. Use remover." });
        }

        const result = await clearContext(userId.trim());
        return res.json({ action: "remover", ...result });
    } catch (error) {
        console.error("❌ [CONTEXT] Erro ao remover contexto:", error);
        return res.status(500).json({ error: "Não foi possível remover o contexto." });
    }
}

module.exports = { chatController, clearChatContextController };
