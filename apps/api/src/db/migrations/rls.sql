-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_topic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_style_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can only see and modify their own records
CREATE POLICY "user_isolation_policy" ON users FOR ALL USING (auth_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "academic_profiles_isolation" ON academic_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "subjects_isolation" ON subjects FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "resources_isolation" ON resources FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "knowledge_graph_isolation" ON knowledge_graph_nodes FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "resource_chunks_isolation" ON resource_chunks FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "pyq_questions_isolation" ON pyq_questions FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "answer_bank_isolation" ON answer_bank FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "flashcards_isolation" ON flashcards FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "study_sessions_isolation" ON study_sessions FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "student_models_isolation" ON student_models FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "student_topic_profiles_isolation" ON student_topic_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "homework_style_profiles_isolation" ON homework_style_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = current_setting('request.jwt.claim.sub', true)));
