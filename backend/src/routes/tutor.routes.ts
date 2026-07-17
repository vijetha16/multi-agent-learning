import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "../database.js";
import { asyncRoute,authenticate } from "../http.js";
import { rows } from "../database.js";
import { recordActivity } from "../services/activity.service.js";
import { generateStructured } from "../services/ai.service.js";

const router=Router();router.use(authenticate);
const tutorAnswer=z.object({question:z.string(),topic:z.string(),directAnswer:z.string(),analogy:z.string().nullable(),steps:z.array(z.string()).min(1).max(8),code:z.string().nullable(),visual:z.object({nodes:z.array(z.object({id:z.number().int(),label:z.string()})).min(1).max(8),caption:z.string()}),followUps:z.array(z.string()).min(2).max(4)});
const tutorSchema={type:"object",additionalProperties:false,required:["question","topic","directAnswer","analogy","steps","code","visual","followUps"],properties:{question:{type:"string"},topic:{type:"string"},directAnswer:{type:"string"},analogy:{type:["string","null"]},steps:{type:"array",minItems:1,maxItems:8,items:{type:"string"}},code:{type:["string","null"]},visual:{type:"object",additionalProperties:false,required:["nodes","caption"],properties:{nodes:{type:"array",minItems:1,maxItems:8,items:{type:"object",additionalProperties:false,required:["id","label"],properties:{id:{type:"integer"},label:{type:"string"}}}},caption:{type:"string"}}},followUps:{type:"array",minItems:2,maxItems:4,items:{type:"string"}}}};

router.post("/ask",asyncRoute(async(request,response)=>{
  const input=z.object({question:z.string().min(1).max(4000).refine(value=>value.trim().length>0,"Question is required"),language:z.enum(["python","java","general"]).default("general"),conversationId:z.string().min(8).max(80)}).parse(request.body);
  const historyRows=await rows<RowDataPacket[]>(`SELECT metadata_json FROM user_activities WHERE user_id=? AND activity_type='ai_chat_usage' ORDER BY created_at DESC LIMIT 30`,[request.user!.id]);
  const history=historyRows.map(row=>typeof row.metadata_json==="string"?JSON.parse(row.metadata_json):row.metadata_json).filter(item=>item?.conversationId===input.conversationId&&item?.question&&item?.answer).slice(0,8).reverse();
  const messages:Array<{role:"developer"|"user"|"assistant";content:string}>=[{role:"developer",content:`You are Lumi, a capable general-purpose AI assistant. Answer the user's actual request directly and naturally. Preserve context from earlier turns. For programming questions, provide correct relevant code and explain it. For theoretical questions, give a detailed, accurate explanation. For unrelated or everyday questions, answer normally without forcing an educational framing. Never claim to have used tools or sources you did not use. Return content that fits the required JSON schema. The language preference is ${input.language}; use it for code only when relevant, not to distort unrelated answers.`}];
  for(const item of history){messages.push({role:"user",content:String(item.question)},{role:"assistant",content:JSON.stringify(item.answer)});}messages.push({role:"user",content:input.question});
  const generated=tutorAnswer.parse(await generateStructured<unknown>(messages,{name:"lumi_answer",schema:tutorSchema}));
  const result={...generated,question:input.question};
  await recordActivity(request.user!.id,"ai_chat_usage",`Asked Lumi: ${input.question.slice(0,100)}`,request.ip,{conversationId:input.conversationId,question:input.question,language:input.language,answer:result});
  response.json(result);
}));

router.get("/history",asyncRoute(async(request,response)=>{const conversationId=z.string().min(8).max(80).optional().parse(request.query.conversationId);const data=await rows<RowDataPacket[]>(`SELECT id,metadata_json,created_at FROM user_activities WHERE user_id=? AND activity_type='ai_chat_usage' ORDER BY created_at DESC LIMIT 50`,[request.user!.id]);const parsed=data.map(row=>({...row,metadata_json:typeof row.metadata_json==="string"?JSON.parse(row.metadata_json):row.metadata_json}));response.json(conversationId?parsed.filter(row=>row.metadata_json?.conversationId===conversationId):parsed);}));
export default router;
