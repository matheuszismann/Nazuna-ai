const { pool } = require("../config/database");

const MAX_MEMORIES_PER_USER = 100;
const MAX_KEY_LENGTH = 80;
const MAX_VALUE_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 50;
const MAX_CONTEXT_MESSAGES = 15;
const MAX_CONTEXT_CONTENT_LENGTH = 4000;

function isValidUserId(userId) {
    return typeof userId === "string" && /^[a-f0-9-]{36}$/i.test(userId.trim());
}

function normalizeText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

async function getMemories(userId) {
    if (!isValidUserId(userId)) return [];

    const result = await pool.query(
        `SELECT categoria, chave, valor FROM memories
         WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
        [userId.trim(), MAX_MEMORIES_PER_USER]
    );

    return result.rows;
}

async function saveContextMessage(userId, role, content) {
    if (!isValidUserId(userId) || !["user", "assistant"].includes(role)) return;

    const cleanContent = normalizeText(content, MAX_CONTEXT_CONTENT_LENGTH);
    if (!cleanContent) return;

    await pool.query(
        `INSERT INTO chat_context_messages (user_id, role, content)
         VALUES ($1, $2, $3)`,
        [userId.trim(), role, cleanContent]
    );

    await pool.query(
        `DELETE FROM chat_context_messages
         WHERE user_id = $1
           AND id NOT IN (
               SELECT id FROM chat_context_messages
               WHERE user_id = $1
               ORDER BY created_at DESC, id DESC
               LIMIT $2
           )`,
        [userId.trim(), MAX_CONTEXT_MESSAGES]
    );
}

async function saveContextMessages(userId, messages) {
    if (!Array.isArray(messages)) return;

    for (const message of messages) {
        await saveContextMessage(userId, message.role, message.content);
    }
}

async function getRecentContext(userId) {
    if (!isValidUserId(userId)) return [];

    const result = await pool.query(
        `SELECT role, content FROM (
             SELECT role, content, created_at, id
             FROM chat_context_messages
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT $2
         ) recent
         ORDER BY created_at ASC, id ASC`,
        [userId.trim(), MAX_CONTEXT_MESSAGES]
    );

    return result.rows;
}

async function clearContext(userId) {
    if (!isValidUserId(userId)) {
        return { success: false, reason: "User ID inválido." };
    }

    const result = await pool.query(
        `DELETE FROM chat_context_messages WHERE user_id = $1`,
        [userId.trim()]
    );

    return { success: true, removed: result.rowCount };
}

async function applyLearning(userId, aprender) {
    if (!isValidUserId(userId)) return { success: false, action: null, reason: "User ID inválido." };
    if (!aprender || typeof aprender !== "object") return { success: false, action: null, reason: "Dados de aprendizagem inválidos." };

    const categoria = normalizeText(aprender.categoria, MAX_CATEGORY_LENGTH);
    const chave = normalizeText(aprender.chave, MAX_KEY_LENGTH);
    const valor = normalizeText(aprender.valor, MAX_VALUE_LENGTH);
    const acao = normalizeText(aprender.acao || aprender.action, 30).toLowerCase();

    if (!categoria || !chave) return { success: false, action: null, reason: "Categoria ou chave ausente." };
    const cleanUserId = userId.trim();

    try {
        if (["delete", "remover", "remove"].includes(acao)) {
            const result = await pool.query(
                `DELETE FROM memories WHERE user_id = $1 AND categoria = $2 AND chave = $3`,
                [cleanUserId, categoria, chave]
            );
            return { success: true, action: "delete", reason: result.rowCount > 0 ? "Memória removida." : "Memória não encontrada." };
        }

        if (!valor) return { success: false, action: null, reason: "Valor ausente." };

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM memories WHERE user_id = $1`,
            [cleanUserId]
        );
        const existingResult = await pool.query(
            `SELECT id FROM memories WHERE user_id = $1 AND categoria = $2 AND chave = $3 LIMIT 1`,
            [cleanUserId, categoria, chave]
        );
        const exists = existingResult.rowCount > 0;

        if (!exists && countResult.rows[0].total >= MAX_MEMORIES_PER_USER) {
            return { success: false, action: null, reason: "Limite de memórias atingido." };
        }

        await pool.query(
            `INSERT INTO memories (user_id, categoria, chave, valor)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, categoria, chave)
             DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
            [cleanUserId, categoria, chave, valor]
        );

        return { success: true, action: exists ? "update" : "create", reason: exists ? "Memória atualizada." : "Memória criada." };
    } catch (error) {
        console.error("❌ [MEMORY] Erro ao salvar memória:", error);
        return { success: false, action: null, reason: "Erro ao acessar o banco de dados." };
    }
}

async function buildMemoryContext(userId) {
    const [memories, recentContext] = await Promise.all([
        getMemories(userId),
        getRecentContext(userId)
    ]);

    const memoryText = memories.length
        ? memories.map(memory => `- [${memory.categoria}] ${memory.chave}: ${memory.valor}`).join("\n")
        : "Nenhuma memória persistente registrada.";

    const contextText = recentContext.length
        ? recentContext.map(item => `${item.role === "user" ? "Usuário" : "Nazuna"}: ${item.content}`).join("\n")
        : "Nenhuma mensagem anterior registrada.";

    return `${memoryText}\n\nÚLTIMAS 15 MENSAGENS DE CONTEXTO\n${contextText}`;
}

module.exports = {
    getMemories,
    applyLearning,
    buildMemoryContext,
    saveContextMessage,
    saveContextMessages,
    getRecentContext,
    clearContext
};
