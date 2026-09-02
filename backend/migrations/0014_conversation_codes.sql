-- Código legible de conversación. La app navega con `chat-service-walk-001`.

ALTER TABLE conversations ADD COLUMN code TEXT UNIQUE;

CREATE INDEX conversations_code_idx ON conversations (code);
