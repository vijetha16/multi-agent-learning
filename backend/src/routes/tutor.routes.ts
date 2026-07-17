import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "../database.js";
import { asyncRoute, authenticate } from "../http.js";
import { rows } from "../database.js";
import { recordActivity } from "../services/activity.service.js";

const router=Router();
router.use(authenticate);

const concepts=[
  {keys:["loop","iteration","for loop","while loop"],title:"Loops",answer:"A loop repeats a block of instructions until a sequence is exhausted or a condition changes.",analogy:"Think of checking every item in a shopping basket: the action repeats once for each item.",steps:["Choose what must repeat","Define the sequence or stopping condition","Run the repeated action","Update state and stop safely"],python:"for item in basket:\n    print(item)",java:"for (String item : basket) {\n    System.out.println(item);\n}"},
  {keys:["variable","data type"],title:"Variables",answer:"A variable gives a meaningful name to a value so a program can store, read, and update information.",analogy:"It is like a labelled container: the label is the variable name and the content is the current value.",steps:["Choose a descriptive name","Assign a value","Use it in an expression","Update it when the state changes"],python:"score = 10\nscore = score + 5",java:"int score = 10;\nscore = score + 5;"},
  {keys:["function","method"],title:"Functions",answer:"A function packages reusable behavior behind a name, accepts inputs, and can return an output.",analogy:"A function is like a small machine: ingredients go in, a defined process runs, and a result comes out.",steps:["Define the responsibility","Choose input parameters","Perform one focused task","Return or use the result"],python:"def greet(name):\n    return f\"Hello, {name}!\"",java:"String greet(String name) {\n    return \"Hello, \" + name + \"!\";\n}"},
  {keys:["class","object","inheritance","oop"],title:"Object-Oriented Programming",answer:"A class describes the data and behavior of a kind of object; an object is one concrete instance created from that class.",analogy:"A class is a blueprint, while each house built from it is an object with its own state.",steps:["Model one clear concept","Define its state","Add behavior that belongs to it","Create objects and let them collaborate"],python:"class Learner:\n    def __init__(self, name):\n        self.name = name",java:"class Learner {\n    String name;\n    Learner(String name) { this.name = name; }\n}"},
  {keys:["api","rest","endpoint"],title:"APIs",answer:"An API is a defined contract that lets one program request data or actions from another program.",analogy:"It works like a restaurant menu: you choose a supported request, the kitchen performs the work, and a structured response returns.",steps:["Client sends a request","Route validates the request","Service performs the work","Server returns a status and response"],python:"response = requests.get(\"/api/courses\")\nprint(response.json())",java:"var request = HttpRequest.newBuilder(uri).GET().build();"},
  {keys:["database","sql","table","mysql"],title:"Databases",answer:"A relational database stores structured records in tables and connects them through keys so data stays consistent and queryable.",analogy:"Imagine organized filing cabinets where IDs create reliable cross-references between folders.",steps:["Model entities as tables","Give every row a primary key","Connect related data with foreign keys","Query through indexed columns"],python:"cursor.execute(\"SELECT * FROM courses WHERE id = %s\", (course_id,))",java:"repository.findById(courseId);"},
  {keys:["recursion","recursive"],title:"Recursion",answer:"Recursion solves a problem by calling the same function on a smaller version of that problem until a base case is reached.",analogy:"It is like opening nested boxes: keep opening the next smaller box until there is no box left.",steps:["Define the smallest base case","Reduce the problem size","Call the function on the smaller problem","Combine or return the result"],python:"def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)",java:"int factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n - 1);\n}"},
  {keys:["exception","error","try catch"],title:"Error Handling",answer:"Error handling lets a program respond safely to expected failures instead of stopping without explanation.",analogy:"It is a safety net: normal work happens in the try block and a recovery plan handles a known fall.",steps:["Identify operations that may fail","Catch only expected failures","Provide a useful recovery or message","Preserve diagnostic information"],python:"try:\n    value = int(text)\nexcept ValueError:\n    print(\"Enter a number\")",java:"try {\n    int value = Integer.parseInt(text);\n} catch (NumberFormatException error) {\n    System.out.println(\"Enter a number\");\n}"},
];

router.post("/ask",asyncRoute(async(request,response)=>{
  const input=z.object({question:z.string().min(3).max(1000),language:z.enum(["python","java","general"]).default("general")}).parse(request.body);
  const normalized=input.question.toLowerCase();
  const concept=concepts.find(item=>item.keys.some(key=>normalized.includes(key)))??{
    title:"Problem-Solving Framework",
    answer:"Break the doubt into the input you have, the result you need, the rule connecting them, and one small example you can test.",
    analogy:"Treat the problem like a map: mark where you are, where you want to go, and the smallest reliable next step.",
    steps:["Restate the question in your own words","List known inputs and constraints","Solve one tiny example","Generalize the pattern and test an edge case"],
    python:"# Write one small example first\nresult = solve(example)",
    java:"// Write one small example first\nvar result = solve(example);",
  };
  const code=input.language==="java"?concept.java:concept.python;
  const result={
    question:input.question,topic:concept.title,directAnswer:concept.answer,analogy:concept.analogy,
    steps:concept.steps,code:input.language==="general"?null:code,
    visual:{nodes:concept.steps.map((label,index)=>({id:index+1,label})),caption:`How to reason about ${concept.title}`},
    followUps:[`Show me another ${concept.title.toLowerCase()} example`,`Give me a practice question`,`Explain this more simply`],
  };
  await recordActivity(request.user!.id,"ai_chat_usage",`Asked Lumi about ${concept.title}`,request.ip,{question:input.question,topic:concept.title,language:input.language});
  response.json(result);
}));

router.get("/history",asyncRoute(async(request,response)=>{
  response.json(await rows<RowDataPacket[]>(
    `SELECT id,description,metadata_json,created_at FROM user_activities
     WHERE user_id=? AND activity_type='ai_chat_usage' ORDER BY created_at DESC LIMIT 12`,
    [request.user!.id],
  ));
}));

export default router;
