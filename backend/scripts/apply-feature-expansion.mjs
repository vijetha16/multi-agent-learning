import fs from "node:fs/promises";
import pg from "pg";

const connectionString=(process.env.POSTGRES_URL_NON_POOLING||process.env.POSTGRES_URL||process.env.DATABASE_URL||"").replace(/[?&]sslmode=[^&]+/,"");
if(!connectionString)throw new Error("A PostgreSQL connection string is required");
const sql=await fs.readFile(new URL("../database/feature-expansion.sql",import.meta.url),"utf8");
const client=new pg.Client({connectionString,ssl:{rejectUnauthorized:false}});
await client.connect();
try{await client.query(sql);console.log("Feature expansion migration applied");}
finally{await client.end();}
