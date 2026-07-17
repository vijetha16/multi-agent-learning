USE lumio_learning;

INSERT INTO interests (name, slug) VALUES
('Artificial Intelligence','artificial-intelligence'),('Machine Learning','machine-learning'),
('Cyber Security','cyber-security'),('Web Development','web-development'),('Cloud','cloud'),
('Data Science','data-science'),('UI/UX','ui-ux'),('Game Development','game-development'),
('Blockchain','blockchain'),('Programming','programming')
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

INSERT INTO courses
(name,slug,description,difficulty,duration_minutes,total_levels,credits_required,certificate_company,certificate_name,category_interest_id,is_published)
VALUES
('Cyber Security Defender','cyber-security-defender','Protect systems through threat awareness, secure design, ethical testing, and incident response.','beginner',135,3,120,'SecureFuture Labs','Cyber Security Defender Certificate',(SELECT id FROM interests WHERE slug='cyber-security'),TRUE),
('Modern Web Development','modern-web-development','Build responsive, accessible web applications with HTML, CSS, JavaScript, React, and APIs.','beginner',150,3,0,'WebCraft Academy','Modern Web Developer Certificate',(SELECT id FROM interests WHERE slug='web-development'),TRUE),
('Cloud Engineering','cloud-engineering','Understand cloud architecture, deployment, reliability, observability, and cost-aware scaling.','intermediate',145,3,150,'CloudNova','Cloud Engineering Foundations',(SELECT id FROM interests WHERE slug='cloud'),TRUE),
('Data Science Explorer','data-science-explorer','Turn raw data into trustworthy insight using analysis, visualization, statistics, and experimentation.','beginner',140,3,0,'DataWorks Institute','Data Science Explorer Certificate',(SELECT id FROM interests WHERE slug='data-science'),TRUE),
('UI/UX Product Design','ui-ux-product-design','Research user needs, shape intuitive flows, prototype interfaces, and validate product experiences.','beginner',125,3,0,'DesignForward','UI/UX Product Designer Certificate',(SELECT id FROM interests WHERE slug='ui-ux'),TRUE),
('Game Development Studio','game-development-studio','Learn game loops, player feedback, level design, mechanics, and iterative playtesting.','beginner',155,3,0,'PlayForge Studio','Game Development Foundations',(SELECT id FROM interests WHERE slug='game-development'),TRUE),
('Blockchain Essentials','blockchain-essentials','Explore distributed ledgers, consensus, smart contracts, wallets, and responsible Web3 design.','intermediate',130,3,200,'ChainLab','Blockchain Essentials Certificate',(SELECT id FROM interests WHERE slug='blockchain'),TRUE),
('Applied Machine Learning','applied-machine-learning','Create practical prediction systems with feature engineering, evaluation, iteration, and deployment.','intermediate',165,3,180,'FutureSkills Academy','Applied Machine Learning Certificate',(SELECT id FROM interests WHERE slug='machine-learning'),TRUE),
('Python Developer Path','python-developer-path','Learn Python from variables and control flow through functions, data structures, APIs, and a practical capstone.','beginner',240,6,0,'Python Learning Institute','Certified Python Developer Foundations',(SELECT id FROM interests WHERE slug='programming'),TRUE),
('Java Developer Path','java-developer-path','Master Java syntax, object-oriented design, collections, exceptions, testing, and a complete application.','beginner',260,6,0,'Java Skills Network','Certified Java Developer Foundations',(SELECT id FROM interests WHERE slug='programming'),TRUE),
('Python AI Automation','python-ai-automation','Use advanced Python to automate workflows, integrate APIs, process data, and build AI-powered tools.','advanced',190,4,250,'AutomationWorks','Python AI Automation Specialist',(SELECT id FROM interests WHERE slug='programming'),TRUE),
('Java Spring Backend','java-spring-backend','Build production-style Java services with Spring Boot, REST APIs, persistence, testing, and security.','advanced',210,4,300,'Enterprise Java Guild','Spring Backend Developer Certificate',(SELECT id FROM interests WHERE slug='programming'),TRUE)
ON DUPLICATE KEY UPDATE description=VALUES(description),is_published=TRUE,total_levels=VALUES(total_levels),credits_required=VALUES(credits_required);

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

INSERT INTO course_levels (course_id,level_number,title,description,xp_reward,credits_reward)
SELECT c.id,n.level_number,
  CASE n.level_number WHEN 1 THEN CONCAT(c.name,' Essentials') WHEN 2 THEN CONCAT('Applied ',c.name) ELSE CONCAT(c.name,' Capstone') END,
  CASE n.level_number WHEN 1 THEN 'Build the core mental models and vocabulary.' WHEN 2 THEN 'Practice the skills through guided real-world scenarios.' ELSE 'Combine your skills in a portfolio-ready challenge.' END,
  n.level_number*120,n.level_number*30
FROM courses c CROSS JOIN (SELECT 1 level_number UNION ALL SELECT 2 UNION ALL SELECT 3) n
WHERE c.slug<>'ai-machine-learning'
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),credits_reward=VALUES(credits_reward);

INSERT INTO course_levels (course_id,level_number,title,description,xp_reward,credits_reward) VALUES
((SELECT id FROM courses WHERE slug='python-developer-path'),1,'Python Basics','Variables, data types, input, output, and expressions.',100,20),
((SELECT id FROM courses WHERE slug='python-developer-path'),2,'Decisions & Loops','Control program flow with conditions and iteration.',140,30),
((SELECT id FROM courses WHERE slug='python-developer-path'),3,'Functions & Modules','Write reusable functions and organize Python code.',180,40),
((SELECT id FROM courses WHERE slug='python-developer-path'),4,'Python Data Structures','Work confidently with lists, dictionaries, sets, and tuples.',220,50),
((SELECT id FROM courses WHERE slug='python-developer-path'),5,'APIs & Files','Read files, handle data, and connect to web APIs.',270,60),
((SELECT id FROM courses WHERE slug='python-developer-path'),6,'Python Capstone','Combine the full path into a portfolio-ready application.',350,100),
((SELECT id FROM courses WHERE slug='java-developer-path'),1,'Java Foundations','Syntax, variables, operators, and the Java runtime.',100,20),
((SELECT id FROM courses WHERE slug='java-developer-path'),2,'Control Flow','Use conditions, loops, methods, and arrays.',140,30),
((SELECT id FROM courses WHERE slug='java-developer-path'),3,'Object-Oriented Java','Design classes with encapsulation, inheritance, and interfaces.',180,40),
((SELECT id FROM courses WHERE slug='java-developer-path'),4,'Collections & Exceptions','Build reliable programs with collections and error handling.',220,50),
((SELECT id FROM courses WHERE slug='java-developer-path'),5,'Testing & Persistence','Test Java code and store application data.',270,60),
((SELECT id FROM courses WHERE slug='java-developer-path'),6,'Java Capstone','Create and present a complete Java application.',350,100),
((SELECT id FROM courses WHERE slug='python-ai-automation'),4,'Automation Capstone','Deliver an AI-assisted automation with monitoring and safeguards.',360,120),
((SELECT id FROM courses WHERE slug='java-spring-backend'),4,'Spring Service Capstone','Ship a secure, tested, database-backed Spring service.',360,120)
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),xp_reward=VALUES(xp_reward),credits_reward=VALUES(credits_reward);

INSERT INTO lessons (course_id,level_id,lesson_number,title,description,notes,estimated_minutes,credits_reward)
SELECT cl.course_id,cl.id,cl.level_number*10+1,
  CASE cl.level_number WHEN 1 THEN CONCAT('Start with ',c.name) WHEN 2 THEN CONCAT(c.name,' in Practice') ELSE CONCAT('Build Your ',c.name,' Project') END,
  cl.description,
  CONCAT('This guided lesson introduces ',c.name,' through concrete examples and active practice. You will identify the most important concepts, connect them to a real-world situation, make a small design decision, and reflect on what evidence would show that your solution works.'),
  CASE cl.level_number WHEN 1 THEN 20 WHEN 2 THEN 28 ELSE 35 END,
  cl.level_number*15
FROM course_levels cl JOIN courses c ON c.id=cl.course_id
WHERE c.slug<>'ai-machine-learning'
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),notes=VALUES(notes);
