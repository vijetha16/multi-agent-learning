import pg from "pg";

const { Pool }=pg;
const connectionString=(process.env.POSTGRES_URL_NON_POOLING||process.env.POSTGRES_URL||process.env.DATABASE_URL||"").replace(/[?&]sslmode=[^&]+/,"");
if(!connectionString) throw new Error("POSTGRES_URL is required");

export type RowDataPacket=Record<string,any>;
export type ResultSetHeader={insertId:number;affectedRows:number};
type QueryResult=[RowDataPacket[]|ResultSetHeader,unknown];

function postgresSql(source:string){
  let index=0;
  return source
    .replace(/\?/g,()=>`$${++index}`)
    .replace(/\bNOW\(\)/gi,"CURRENT_TIMESTAMP")
    .replace(/COALESCE\(([^,]+),\s*IF\(([^,]+),\s*'([^']+)',\s*'([^']+)'\)\)/gi,"COALESCE($1, CASE WHEN $2 THEN '$3' ELSE '$4' END)");
}

export class DbConnection{
  constructor(private client:pg.PoolClient){}
  async execute<T=any>(sql:string,values:any[]=[]):Promise<[T,unknown]>{
    const isInsert=/^\s*INSERT\b/i.test(sql);
    let statement=postgresSql(sql);
    const result=await this.client.query(statement,values);
    if(/^\s*SELECT\b/i.test(sql)||/\bRETURNING\b/i.test(statement)) {
      if(isInsert) return [{insertId:Number(result.rows[0]?.id??0),affectedRows:result.rowCount??0} as T,undefined];
      return [result.rows as T,undefined];
    }
    return [{insertId:0,affectedRows:result.rowCount??0} as T,undefined];
  }
}

export type PoolConnection=DbConnection;
export const db=new Pool({connectionString,ssl:{rejectUnauthorized:false},max:10});

export async function rows<T extends RowDataPacket[]>(sql:string,values:any[]=[]):Promise<T>{
  const result=await db.query(postgresSql(sql),values);return result.rows as T;
}
export async function execute(sql:string,values:any[]=[]):Promise<ResultSetHeader>{
  const client=await db.connect();try{return (await new DbConnection(client).execute<ResultSetHeader>(sql,values))[0]}finally{client.release()}
}
export async function transaction<T>(work:(connection:DbConnection)=>Promise<T>):Promise<T>{
  const client=await db.connect();try{await client.query("BEGIN");const value=await work(new DbConnection(client));await client.query("COMMIT");return value}catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
