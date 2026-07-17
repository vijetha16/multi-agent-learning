CREATE DATABASE IF NOT EXISTS lumio_learning
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lumio_learning;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  bio VARCHAR(500),
  phone_number VARCHAR(30),
  country VARCHAR(100),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  account_status ENUM('active','suspended','pending','deleted') NOT NULL DEFAULT 'active',
  role ENUM('learner','admin') NOT NULL DEFAULT 'learner',
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_status_role (account_status, role)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  experience_level ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  current_learning_path_id BIGINT UNSIGNED NULL,
  credits_balance INT UNSIGNED NOT NULL DEFAULT 0,
  daily_streak INT UNSIGNED NOT NULL DEFAULT 0,
  longest_streak INT UNSIGNED NOT NULL DEFAULT 0,
  last_learning_date DATE NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE interests (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(90) NOT NULL,
  UNIQUE KEY uq_interests_name (name),
  UNIQUE KEY uq_interests_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE user_interests (
  user_id BIGINT UNSIGNED NOT NULL,
  interest_id SMALLINT UNSIGNED NOT NULL,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, interest_id),
  CONSTRAINT fk_user_interests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_interests_interest FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_skills_name (name)
) ENGINE=InnoDB;

CREATE TABLE user_skills (
  user_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  proficiency TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT chk_skill_proficiency CHECK (proficiency BETWEEN 1 AND 5),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE courses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  difficulty ENUM('beginner','intermediate','advanced') NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  total_levels INT UNSIGNED NOT NULL DEFAULT 0,
  credits_required INT UNSIGNED NOT NULL DEFAULT 0,
  certificate_company VARCHAR(180),
  certificate_name VARCHAR(180),
  completion_requirement TINYINT UNSIGNED NOT NULL DEFAULT 100,
  category_interest_id SMALLINT UNSIGNED NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_courses_slug (slug),
  INDEX idx_courses_discovery (is_published, difficulty, credits_required),
  CONSTRAINT fk_courses_interest FOREIGN KEY (category_interest_id) REFERENCES interests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE user_profiles
  ADD CONSTRAINT fk_profiles_current_path FOREIGN KEY (current_learning_path_id)
  REFERENCES courses(id) ON DELETE SET NULL;

CREATE TABLE course_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  level_number INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description VARCHAR(500),
  xp_reward INT UNSIGNED NOT NULL DEFAULT 0,
  credits_reward INT UNSIGNED NOT NULL DEFAULT 0,
  unlock_requirement_level INT UNSIGNED NULL,
  UNIQUE KEY uq_course_level (course_id, level_number),
  CONSTRAINT fk_levels_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  level_id BIGINT UNSIGNED NOT NULL,
  lesson_number INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  notes MEDIUMTEXT,
  estimated_minutes INT UNSIGNED NOT NULL DEFAULT 10,
  credits_reward INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_course_lesson (course_id, lesson_number),
  INDEX idx_lessons_level (level_id, lesson_number),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_lessons_level FOREIGN KEY (level_id) REFERENCES course_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quizzes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  passing_score TINYINT UNSIGNED NOT NULL DEFAULT 70,
  perfect_score_bonus INT UNSIGNED NOT NULL DEFAULT 10,
  UNIQUE KEY uq_quiz_lesson (lesson_id),
  CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  prompt TEXT NOT NULL,
  explanation TEXT,
  position INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_quiz_question_position (quiz_id, position),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position TINYINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_question_option_position (question_id, position),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE course_enrollments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('active','completed','paused') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_enrollment (user_id, course_id),
  INDEX idx_enrollment_user_status (user_id, status),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_level_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  level_id BIGINT UNSIGNED NOT NULL,
  status ENUM('locked','unlocked','in_progress','completed') NOT NULL DEFAULT 'locked',
  completion_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  stars TINYINT UNSIGNED NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_level (user_id, level_id),
  INDEX idx_level_progress_user_status (user_id, status),
  CONSTRAINT chk_progress_percent CHECK (completion_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_level_stars CHECK (stars BETWEEN 0 AND 3),
  CONSTRAINT fk_level_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_level_progress_level FOREIGN KEY (level_id) REFERENCES course_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_lesson_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  completion_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  time_spent_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_lesson (user_id, lesson_id),
  INDEX idx_lesson_progress_user_status (user_id, status),
  CONSTRAINT chk_lesson_percent CHECK (completion_percent BETWEEN 0 AND 100),
  CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  quiz_id BIGINT UNSIGNED NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  passed BOOLEAN NOT NULL,
  answers_json JSON,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quiz_attempt_user (user_id, quiz_id, attempted_at),
  CONSTRAINT chk_quiz_score CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE credit_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  credits_delta INT NOT NULL,
  reason ENUM('lesson_complete','quiz_complete','daily_login','weekly_streak','level_complete','perfect_quiz','course_complete','admin_adjustment','course_unlock') NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT UNSIGNED,
  idempotency_key VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_credit_idempotency (idempotency_key),
  INDEX idx_credit_user_date (user_id, created_at),
  CONSTRAINT fk_credit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  activity_type ENUM('login','logout','lesson_started','lesson_completed','quiz_attempted','credits_earned','course_enrolled','roadmap_progress','badge_unlocked','certificate_generated','ai_chat_usage','search','profile_updated') NOT NULL,
  description VARCHAR(500) NOT NULL,
  metadata_json JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_user_date (user_id, created_at),
  INDEX idx_activity_type_date (activity_type, created_at),
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE badges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  icon_url VARCHAR(500),
  criteria_json JSON,
  UNIQUE KEY uq_badges_name (name)
) ENGINE=InnoDB;

CREATE TABLE user_badges (
  user_id BIGINT UNSIGNED NOT NULL,
  badge_id INT UNSIGNED NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE certificates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  certificate_number VARCHAR(64) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  certificate_name VARCHAR(180) NOT NULL,
  status ENUM('eligible','issued','revoked') NOT NULL DEFAULT 'eligible',
  issued_at TIMESTAMP NULL,
  certificate_url VARCHAR(500),
  UNIQUE KEY uq_certificate_user_course (user_id, course_id),
  UNIQUE KEY uq_certificate_number (certificate_number),
  CONSTRAINT fk_certificates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  INDEX idx_refresh_user_active (user_id, revoked_at, expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
