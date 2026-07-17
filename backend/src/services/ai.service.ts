import { config } from "../config.js";
import { ApiError } from "../http.js";

type InputMessage={role:"developer"|"user"|"assistant";content:string};
type JsonSchema={name:string;schema:Record<string,unknown>};

function extractOutputText(response:Record<string,any>){
  if(typeof response.output_text==="string")return response.output_text;
  for(const item of response.output??[])for(const content of item.content??[])if(content.type==="output_text"&&typeof content.text==="string")return content.text;
  return null;
}

export async function generateStructured<T>(messages:InputMessage[],format:JsonSchema):Promise<T>{
  if(!config.OPENAI_API_KEY)throw new ApiError(503,"AI is not configured. Add OPENAI_API_KEY to the backend environment.");
  let response:Response;
  try{
    response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${config.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:config.OPENAI_MODEL,
        input:messages,
        reasoning:{effort:"medium"},
        text:{verbosity:"medium",format:{type:"json_schema",name:format.name,strict:true,schema:format.schema}},
      }),
      signal:AbortSignal.timeout(90_000),
    });
  }catch(error){
    throw new ApiError(502,"The AI service could not be reached. Please try again.",error instanceof Error?error.message:undefined);
  }
  if(!response.ok){
    const body=await response.json().catch(()=>null) as Record<string,any>|null;
    const message=body?.error?.message;
    throw new ApiError(response.status===429?429:502,message??"The AI service could not generate a response.");
  }
  const raw=await response.json() as Record<string,any>;
  const output=extractOutputText(raw);
  if(!output)throw new ApiError(502,"The AI service returned an empty response.");
  try{return JSON.parse(output) as T}catch{throw new ApiError(502,"The AI service returned an invalid response.")}
}
