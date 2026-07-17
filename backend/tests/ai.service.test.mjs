import test from "node:test";
import assert from "node:assert/strict";

process.env.OPENAI_API_KEY="test-key-that-is-long-enough-for-validation";
process.env.OPENAI_MODEL="gpt-5.6-sol";
const {generateStructured}=await import("../dist/services/ai.service.js");

test("passes the exact user input to the Responses API and parses structured output",async()=>{
  const exact="  Explain closures in JavaScript, then show code.  ";let request;
  globalThis.fetch=async(_url,options)=>{request=JSON.parse(options.body);return new Response(JSON.stringify({output:[{content:[{type:"output_text",text:'{"answer":"Generated"}'}]}]}),{status:200,headers:{"content-type":"application/json"}})};
  const result=await generateStructured([{role:"user",content:exact}],{name:"test_answer",schema:{type:"object",additionalProperties:false,required:["answer"],properties:{answer:{type:"string"}}}});
  assert.equal(request.input[0].content,exact);assert.equal(request.model,"gpt-5.6-sol");assert.deepEqual(result,{answer:"Generated"});
});

test("surfaces provider errors instead of returning mock content",async()=>{
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:"Provider unavailable"}}),{status:503,headers:{"content-type":"application/json"}});
  await assert.rejects(()=>generateStructured([{role:"user",content:"hello"}],{name:"test_answer",schema:{type:"object"}}),/Provider unavailable/);
});
