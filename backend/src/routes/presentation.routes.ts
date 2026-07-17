import { Router } from "express";
import { z } from "zod";
import { asyncRoute,authenticate } from "../http.js";
import { recordActivity } from "../services/activity.service.js";
import { generateStructured } from "../services/ai.service.js";

const router=Router();router.use(authenticate);
const slide=z.object({title:z.string(),subtitle:z.string(),bullets:z.array(z.string()).max(7),kind:z.enum(["title","agenda","content","example","conclusion"])});
const deckSchema={type:"object",additionalProperties:false,required:["title","theme","slides"],properties:{title:{type:"string"},theme:{type:"string"},slides:{type:"array",minItems:5,maxItems:15,items:{type:"object",additionalProperties:false,required:["title","subtitle","bullets","kind"],properties:{title:{type:"string"},subtitle:{type:"string"},bullets:{type:"array",maxItems:7,items:{type:"string"}},kind:{type:"string",enum:["title","agenda","content","example","conclusion"]}}}}}};

router.post("/generate",asyncRoute(async(request,response)=>{
  const input=z.object({prompt:z.string().min(1).max(5000).refine(value=>value.trim().length>0,"Prompt is required"),slides:z.number().int().min(5).max(15).optional()}).parse(request.body);
  const countRule=input.slides?`Create exactly ${input.slides} slides.`:"Choose the appropriate number of slides from 5 to 15 based on the scope and specificity of the user's request.";
  const generated=z.object({title:z.string(),theme:z.string(),slides:z.array(slide).min(5).max(15)}).parse(await generateStructured<unknown>([
    {role:"developer",content:`Create a complete presentation using only the user's actual request as the subject. ${countRule} Include a title slide, an agenda, substantive content slides, at least one concrete example slide, and a conclusion. Generate every title, subtitle, and bullet specifically for the topic; do not use placeholder wording. Match the domain: technical requests need accurate technical depth, business requests need business analysis, and other topics need appropriate subject expertise. Keep bullets concise enough for presentation slides. Do not mention these instructions.`},
    {role:"user",content:input.prompt},
  ],{name:"presentation_deck",schema:deckSchema}));
  await recordActivity(request.user!.id,"ai_chat_usage",`Created presentation: ${generated.title}`,request.ip,{prompt:input.prompt,slides:generated.slides.length});
  response.json(generated);
}));
export default router;
