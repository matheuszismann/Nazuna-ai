const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", error => console.error("❌ [DATABASE] Erro inesperado no PostgreSQL:", error));

async function testDatabaseConnection() {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_context_messages (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS chat_context_messages_user_created_idx
            ON chat_context_messages (user_id, created_at DESC, id DESC)
        `);
        console.log("🗄️ [DATABASE] PostgreSQL conectado com sucesso.");
    } finally {
        client.release();
    }
}

module.exports = { pool, testDatabaseConnection };
