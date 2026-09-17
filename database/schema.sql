CREATE TABLE IF NOT EXISTS memories (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    chave VARCHAR(80) NOT NULL,
    valor VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, categoria, chave)
);

CREATE TABLE IF NOT EXISTS chat_context_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_context_messages_user_created_idx
    ON chat_context_messages (user_id, created_at DESC, id DESC);
