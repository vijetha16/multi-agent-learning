import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "../database.js";
import { execute, rows } from "../database.js";
import { ApiError, asyncRoute, authenticate } from "../http.js";

const router=Router();
router.use(authenticate);

router.get("/friends",asyncRoute(async(request,response)=>{
  const friends=await rows<RowDataPacket[]>(`SELECT u.id,u.username,u.full_name,u.profile_picture_url,p.credits_balance,p.daily_streak
    FROM friend_requests f JOIN users u ON u.id=CASE WHEN f.sender_id=? THEN f.receiver_id ELSE f.sender_id END
    JOIN user_profiles p ON p.user_id=u.id WHERE (f.sender_id=? OR f.receiver_id=?) AND f.status='accepted'
    ORDER BY u.full_name`,[request.user!.id,request.user!.id,request.user!.id]);
  const requests=await rows<RowDataPacket[]>(`SELECT f.id,f.created_at,u.username,u.full_name,u.profile_picture_url
    FROM friend_requests f JOIN users u ON u.id=f.sender_id WHERE f.receiver_id=? AND f.status='pending' ORDER BY f.created_at DESC`,[request.user!.id]);
  response.json({friends,requests});
}));

router.get("/friends/search",asyncRoute(async(request,response)=>{
  const query=z.string().min(2).max(32).parse(request.query.q);
  response.json(await rows<RowDataPacket[]>(`SELECT id,username,full_name,profile_picture_url FROM users
    WHERE id<>? AND is_guest=FALSE AND account_status='active' AND username ILIKE ? ORDER BY username LIMIT 12`,[request.user!.id,`%${query}%`]));
}));

router.post("/friends/requests",asyncRoute(async(request,response)=>{
  const input=z.object({username:z.string().min(3).max(32)}).parse(request.body);
  const receiver=(await rows<RowDataPacket[]>("SELECT id FROM users WHERE LOWER(username)=LOWER(?) AND is_guest=FALSE AND account_status='active'",[input.username]))[0];
  if(!receiver)throw new ApiError(404,"Learner not found");
  if(Number(receiver.id)===request.user!.id)throw new ApiError(422,"You cannot add yourself");
  await execute(`INSERT INTO friend_requests (sender_id,receiver_id,status) VALUES (?,?,'pending')
    ON CONFLICT (sender_id,receiver_id) DO UPDATE SET status='pending',updated_at=CURRENT_TIMESTAMP`,[request.user!.id,receiver.id]);
  response.status(201).json({sent:true});
}));

router.patch("/friends/requests/:id",asyncRoute(async(request,response)=>{
  const id=z.coerce.number().int().positive().parse(request.params.id);
  const input=z.object({action:z.enum(["accepted","declined","blocked"])}).parse(request.body);
  await execute("UPDATE friend_requests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND receiver_id=?",[input.action,id,request.user!.id]);
  response.json({updated:true,status:input.action});
}));

const puzzles=[
  {key:"sequence",title:"Pattern sprint",prompt:"What comes next: 2, 6, 12, 20, ?",options:["28","30","32","36"],answer:"30",hint:"Look at how much is added each time."},
  {key:"logic",title:"Logic lock",prompt:"All completed modules earn credits. This module is completed. What can you conclude?",options:["It earns credits","It is locked","It has no quiz","It must be skipped"],answer:"It earns credits",hint:"Apply the stated rule to this module."},
  {key:"memory",title:"Memory match",prompt:"Which practice best strengthens recall after learning?",options:["Active recall","Only rereading","Skipping breaks","Guessing"],answer:"Active recall",hint:"Try to retrieve an answer before looking at it."},
];
router.get("/roadmap-puzzles/:levelId",asyncRoute(async(request,response)=>{
  const levelId=z.coerce.number().int().positive().parse(request.params.levelId);const puzzle=puzzles[levelId%puzzles.length];
  response.json({...puzzle,levelId});
}));
router.post("/roadmap-puzzles/:levelId",asyncRoute(async(request,response)=>{
  const levelId=z.coerce.number().int().positive().parse(request.params.levelId);const input=z.object({puzzleKey:z.string(),answer:z.string().optional(),skip:z.boolean().optional()}).parse(request.body);const puzzle=puzzles.find(item=>item.key===input.puzzleKey);if(!puzzle)throw new ApiError(404,"Puzzle not found");
  const correct=!input.skip&&input.answer===puzzle.answer;const status=input.skip?"skipped":correct?"completed":"shown";
  await execute(`INSERT INTO roadmap_puzzle_attempts (user_id,level_id,puzzle_key,status,answer,completed_at) VALUES (?,?,?,?,?,CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)
    ON CONFLICT (user_id,level_id,puzzle_key) DO UPDATE SET status=EXCLUDED.status,answer=EXCLUDED.answer,completed_at=EXCLUDED.completed_at`,[request.user!.id,levelId,puzzle.key,status,input.answer??null,correct]);
  response.json({correct,status,answer:puzzle.answer,hint:puzzle.hint});
}));
export default router;
