import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "../database.js";
import { execute, rows } from "../database.js";
import { asyncRoute, authenticate } from "../http.js";

const router=Router();
router.use(authenticate);

router.get("/lessons/:lessonId/tools",asyncRoute(async(request,response)=>{
  const lessonId=z.coerce.number().int().positive().parse(request.params.lessonId);
  const [lesson,bookmark,note]=await Promise.all([
    rows<RowDataPacket[]>("SELECT id,title,notes FROM lessons WHERE id=?",[lessonId]),
    rows<RowDataPacket[]>("SELECT 1 bookmarked FROM lesson_bookmarks WHERE user_id=? AND lesson_id=?",[request.user!.id,lessonId]),
    rows<RowDataPacket[]>("SELECT content,updated_at FROM learner_notes WHERE user_id=? AND lesson_id=?",[request.user!.id,lessonId]),
  ]);
  const source=String(lesson[0]?.notes??"").split(/[.!?]\s+/).filter(Boolean).slice(0,8);
  const flashcards=source.map((text,index)=>({id:`${lessonId}-${index+1}`,front:`Key idea ${index+1}: ${lesson[0]?.title}`,back:text}));
  response.json({bookmarked:Boolean(bookmark[0]),note:note[0]??null,flashcards});
}));

router.put("/lessons/:lessonId/bookmark",asyncRoute(async(request,response)=>{
  const lessonId=z.coerce.number().int().positive().parse(request.params.lessonId);
  const input=z.object({bookmarked:z.boolean()}).parse(request.body);
  if(input.bookmarked)await execute("INSERT INTO lesson_bookmarks (user_id,lesson_id) VALUES (?,?) ON CONFLICT (user_id,lesson_id) DO NOTHING",[request.user!.id,lessonId]);
  else await execute("DELETE FROM lesson_bookmarks WHERE user_id=? AND lesson_id=?",[request.user!.id,lessonId]);
  response.json(input);
}));

router.put("/lessons/:lessonId/note",asyncRoute(async(request,response)=>{
  const lessonId=z.coerce.number().int().positive().parse(request.params.lessonId);
  const input=z.object({content:z.string().max(10000)}).parse(request.body);
  await execute(`INSERT INTO learner_notes (user_id,lesson_id,content) VALUES (?,?,?)
    ON CONFLICT (user_id,lesson_id) DO UPDATE SET content=EXCLUDED.content,updated_at=CURRENT_TIMESTAMP`,[request.user!.id,lessonId,input.content]);
  response.json({saved:true});
}));

router.get("/courses/:courseId/community",asyncRoute(async(request,response)=>{
  const courseId=z.coerce.number().int().positive().parse(request.params.courseId);
  const [reviews,comments]=await Promise.all([
    rows<RowDataPacket[]>(`SELECT r.id,r.rating,r.review,r.created_at,u.full_name
      FROM course_reviews r JOIN users u ON u.id=r.user_id WHERE r.course_id=? ORDER BY r.created_at DESC LIMIT 50`,[courseId]),
    rows<RowDataPacket[]>(`SELECT d.id,d.parent_id,d.message,d.created_at,u.full_name
      FROM course_discussions d JOIN users u ON u.id=d.user_id WHERE d.course_id=? ORDER BY d.created_at DESC LIMIT 100`,[courseId]),
  ]);
  response.json({reviews,comments});
}));

router.post("/courses/:courseId/reviews",asyncRoute(async(request,response)=>{
  const courseId=z.coerce.number().int().positive().parse(request.params.courseId);
  const input=z.object({rating:z.number().int().min(1).max(5),review:z.string().min(10).max(2000)}).parse(request.body);
  await execute(`INSERT INTO course_reviews (user_id,course_id,rating,review) VALUES (?,?,?,?)
    ON CONFLICT (user_id,course_id) DO UPDATE SET rating=EXCLUDED.rating,review=EXCLUDED.review,updated_at=CURRENT_TIMESTAMP`,
    [request.user!.id,courseId,input.rating,input.review]);
  response.status(201).json({saved:true});
}));

router.post("/courses/:courseId/discussions",asyncRoute(async(request,response)=>{
  const courseId=z.coerce.number().int().positive().parse(request.params.courseId);
  const input=z.object({message:z.string().min(2).max(3000),parentId:z.number().int().positive().nullable().optional()}).parse(request.body);
  const result=await execute("INSERT INTO course_discussions (user_id,course_id,parent_id,message) VALUES (?,?,?,?) RETURNING id",
    [request.user!.id,courseId,input.parentId??null,input.message]);
  response.status(201).json({id:result.insertId});
}));

router.post("/study-plans/generate",asyncRoute(async(request,response)=>{
  const input=z.object({goal:z.string().min(3).max(500),minutesPerDay:z.number().int().min(10).max(480),days:z.number().int().min(3).max(90)}).parse(request.body);
  const modules=await rows<RowDataPacket[]>(`SELECT l.title,c.name course_name FROM lessons l JOIN courses c ON c.id=l.course_id
    WHERE c.is_published=TRUE ORDER BY c.credits_required,l.lesson_number LIMIT ?`,[input.days]);
  const schedule=Array.from({length:input.days},(_,index)=>({
    day:index+1,title:modules[index%Math.max(modules.length,1)]?.title??`Practice ${input.goal}`,
    course:modules[index%Math.max(modules.length,1)]?.course_name??"Personal study",
    minutes:input.minutesPerDay,activities:["Learn","Recall with flashcards","Complete one practice check"],
  }));
  const result=await execute("INSERT INTO study_plans (user_id,title,goal,minutes_per_day,plan_json) VALUES (?,?,?,?,?) RETURNING id",
    [request.user!.id,`${input.days}-day ${input.goal} plan`,input.goal,input.minutesPerDay,JSON.stringify(schedule)]);
  response.status(201).json({id:result.insertId,title:`${input.days}-day ${input.goal} plan`,schedule});
}));

router.get("/study-plans",asyncRoute(async(request,response)=>{
  response.json(await rows<RowDataPacket[]>("SELECT * FROM study_plans WHERE user_id=? ORDER BY created_at DESC LIMIT 20",[request.user!.id]));
}));

export default router;
