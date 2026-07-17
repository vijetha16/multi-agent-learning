USE lumio_learning;

INSERT INTO interests (name, slug) VALUES
('Artificial Intelligence','artificial-intelligence'),('Machine Learning','machine-learning'),
('Cyber Security','cyber-security'),('Web Development','web-development'),('Cloud','cloud'),
('Data Science','data-science'),('UI/UX','ui-ux'),('Game Development','game-development'),
('Blockchain','blockchain')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO badges (name,description,criteria_json) VALUES
('First Step','Complete your first lesson',JSON_OBJECT('lessons',1)),
('Fast Learner','Complete five lessons in one week',JSON_OBJECT('weekly_lessons',5)),
('Perfect Score','Score 100% on a quiz',JSON_OBJECT('perfect_quizzes',1)),
('Week Warrior','Maintain a seven-day learning streak',JSON_OBJECT('streak_days',7))
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO courses
(name,slug,description,difficulty,duration_minutes,total_levels,credits_required,certificate_company,certificate_name,category_interest_id,is_published)
SELECT 'AI & Machine Learning','ai-machine-learning',
'Learn how intelligent systems work, train a model, and design responsible AI experiences.',
'beginner',164,6,0,'FutureSkills Academy','AI & Machine Learning Foundations',id,TRUE
FROM interests WHERE slug='artificial-intelligence'
ON DUPLICATE KEY UPDATE description=VALUES(description),is_published=TRUE;

SET @course_id=(SELECT id FROM courses WHERE slug='ai-machine-learning');
INSERT INTO course_levels (course_id,level_number,title,description,xp_reward,credits_reward) VALUES
(@course_id,1,'Foundations of AI','Understand intelligence, agents, and real-world AI.',100,25),
(@course_id,2,'How Machines Learn','Explore data, patterns, features, and feedback.',140,35),
(@course_id,3,'Training Your First Model','Move from a dataset to a working classifier.',180,45),
(@course_id,4,'Neural Network Basics','Learn how layers build useful representations.',220,50),
(@course_id,5,'Build a Smart Classifier','Complete a guided end-to-end AI project.',300,75),
(@course_id,6,'AI Ethics & Responsible Design','Evaluate fairness, safety, privacy, and impact.',350,100)
ON DUPLICATE KEY UPDATE title=VALUES(title),credits_reward=VALUES(credits_reward);

INSERT INTO lessons (course_id,level_id,lesson_number,title,description,notes,estimated_minutes,credits_reward)
SELECT @course_id,id,level_number*10+1,
  CASE level_number
    WHEN 1 THEN 'What Makes a Machine Intelligent?'
    WHEN 2 THEN 'Patterns Hidden in Data'
    WHEN 3 THEN 'Prepare Your Training Data'
    WHEN 4 THEN 'Meet the Artificial Neuron'
    WHEN 5 THEN 'Choose Your Classification Goal'
    ELSE 'Fairness Starts With Better Questions'
  END,
  description,CONCAT('Learning notes for ',title),estimated,credits
FROM (
  SELECT cl.*, CASE cl.level_number WHEN 3 THEN 32 WHEN 5 THEN 40 ELSE 22 END estimated,
    CASE cl.level_number WHEN 1 THEN 10 WHEN 2 THEN 15 WHEN 3 THEN 20 WHEN 4 THEN 20 WHEN 5 THEN 30 ELSE 25 END credits
  FROM course_levels cl WHERE cl.course_id=@course_id
) seeded
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description);
