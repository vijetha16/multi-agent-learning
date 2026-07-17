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

UPDATE lessons SET notes=CASE
  WHEN lesson_number=11 THEN 'AI systems observe information, identify patterns, make decisions, and improve through feedback. In this lesson you will compare rule-based automation with learning systems, examine familiar AI products, and design a simple intelligent agent using goal, environment, action, and feedback.'
  WHEN lesson_number=21 THEN 'Machine learning begins with examples. Features describe each example, labels represent the answer, and a model learns a useful relationship between them. You will explore how data quality, representation, and feedback shape the patterns a model discovers.'
  WHEN lesson_number=31 THEN 'A strong model starts with a thoughtful dataset. Learn to collect representative examples, remove duplicates, handle missing values, split training and testing data, and prevent information leakage before training begins.'
  WHEN lesson_number=41 THEN 'An artificial neuron combines several inputs, assigns importance through weights, adds a bias, and passes the result through an activation function. Layers of these simple units can learn increasingly useful representations.'
  WHEN lesson_number=51 THEN 'Classification turns a clear question into a model that chooses among categories. Define the target, select meaningful features, choose evaluation metrics, and build a small experiment that can be improved with evidence.'
  ELSE 'Responsible AI requires fairness, privacy, transparency, human oversight, and continuous evaluation. Learn to identify affected people, examine potential harms, document limitations, and decide when an automated system should not be used.'
END WHERE course_id=@course_id;

INSERT INTO quizzes (lesson_id,title,passing_score,perfect_score_bonus)
SELECT id,CONCAT(title,' Knowledge Check'),70,10 FROM lessons WHERE course_id=@course_id
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO quiz_questions (quiz_id,prompt,explanation,position)
SELECT q.id,
  CASE l.lesson_number
    WHEN 11 THEN 'Which ability best distinguishes a learning AI system from fixed automation?'
    WHEN 21 THEN 'What is a feature in a machine-learning dataset?'
    WHEN 31 THEN 'Why should test data remain separate from training data?'
    WHEN 41 THEN 'What does a weight represent inside an artificial neuron?'
    WHEN 51 THEN 'What should be defined first in a classification project?'
    ELSE 'Which practice is essential for responsible AI?'
  END,
  CASE l.lesson_number
    WHEN 11 THEN 'Learning systems adjust their behavior from examples or feedback.'
    WHEN 21 THEN 'A feature is an input attribute used by the model.'
    WHEN 31 THEN 'Untouched test data provides a fair estimate of performance on new examples.'
    WHEN 41 THEN 'Weights control how strongly each input influences the neuron.'
    WHEN 51 THEN 'A precise target question determines the data, labels, and evaluation approach.'
    ELSE 'Responsible systems consider impact, fairness, privacy, transparency, and human oversight.'
  END,1
FROM quizzes q JOIN lessons l ON l.id=q.lesson_id
WHERE l.course_id=@course_id
AND NOT EXISTS(SELECT 1 FROM quiz_questions existing WHERE existing.quiz_id=q.id AND existing.position=1);

INSERT INTO quiz_options (question_id,option_text,is_correct,position)
SELECT question_id,
  CASE lesson_number
    WHEN 11 THEN ELT(position,'It always runs faster','It can adapt using examples and feedback','It never needs data','It only follows one fixed instruction')
    WHEN 21 THEN ELT(position,'A final prediction','An input attribute describing an example','A database password','The model name')
    WHEN 31 THEN ELT(position,'To make training slower','To provide a fair evaluation on unseen examples','To increase duplicate data','To reveal answers during training')
    WHEN 41 THEN ELT(position,'The color of the neuron','The importance assigned to an input','The number of datasets','The final class name')
    WHEN 51 THEN ELT(position,'The logo color','A precise target question and categories','The deployment server','The certificate design')
    ELSE ELT(position,'Hide all model limitations','Evaluate fairness, privacy, impact, and oversight','Remove human review','Use every available data field')
  END,
  position=2,position
FROM (
  SELECT qq.id question_id,l.lesson_number,p.position
  FROM quiz_questions qq
  JOIN quizzes q ON q.id=qq.quiz_id JOIN lessons l ON l.id=q.lesson_id
  CROSS JOIN (SELECT 1 position UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) p
  WHERE l.course_id=@course_id
) options_seed
ON DUPLICATE KEY UPDATE option_text=VALUES(option_text),is_correct=VALUES(is_correct);
