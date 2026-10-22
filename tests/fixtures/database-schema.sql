-- Database schema v1 — PostgreSQL DDL
-- 14 tables, indexes, and seed data. Delivered for the Phase One milestone.

CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE projects (id SERIAL PRIMARY KEY, owner_id INT REFERENCES users(id), name TEXT NOT NULL);
CREATE TABLE milestones (id SERIAL PRIMARY KEY, project_id INT REFERENCES projects(id), title TEXT NOT NULL, amount_wei NUMERIC);
CREATE TABLE evidence (id SERIAL PRIMARY KEY, milestone_id INT REFERENCES milestones(id), summary TEXT, links JSONB);
CREATE TABLE verdicts (id SERIAL PRIMARY KEY, milestone_id INT REFERENCES milestones(id), met BOOLEAN, score INT, reasons JSONB);
CREATE TABLE payouts (id SERIAL PRIMARY KEY, milestone_id INT REFERENCES milestones(id), amount_wei NUMERIC, tx_hash TEXT);
CREATE TABLE grants (id SERIAL PRIMARY KEY, grantor TEXT NOT NULL, builder TEXT NOT NULL, status TEXT DEFAULT 'FUNDED');
CREATE TABLE grant_milestones (id SERIAL PRIMARY KEY, grant_id INT REFERENCES grants(id), spec TEXT, status TEXT DEFAULT 'OPEN');
CREATE TABLE activity_log (id SERIAL PRIMARY KEY, grant_id INT REFERENCES grants(id), event_type TEXT, payload JSONB, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE sessions (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), token TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ);
CREATE TABLE notifications (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), body TEXT, read_at TIMESTAMPTZ);
CREATE TABLE api_keys (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), key_hash TEXT NOT NULL, label TEXT);
CREATE TABLE audit_trail (id SERIAL PRIMARY KEY, actor TEXT, action TEXT, target TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE settings (key TEXT PRIMARY KEY, value JSONB);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_verdicts_milestone ON verdicts(milestone_id);
CREATE INDEX idx_activity_grant ON activity_log(grant_id);
CREATE INDEX idx_payouts_milestone ON payouts(milestone_id);

INSERT INTO settings (key, value) VALUES ('schema_version', '"1"');
INSERT INTO settings (key, value) VALUES ('seeded', 'true');
