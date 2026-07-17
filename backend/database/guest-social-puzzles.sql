-- Run after feature-expansion.sql when you choose to deploy these features.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users(username) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id,receiver_id),
  CHECK(sender_id<>receiver_id)
);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS roadmap_puzzle_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id BIGINT NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  puzzle_key VARCHAR(80) NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'shown' CHECK (status IN ('shown','completed','skipped')),
  answer TEXT,
  completed_at TIMESTAMP NULL,
  UNIQUE(user_id,level_id,puzzle_key)
);
