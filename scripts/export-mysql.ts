import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import mysql from "mysql2/promise";

const tables=["users","customers_profiles","service_orders","payments","order_timers","booking_counts"] as const;
const url=process.env.LEGACY_DB_URL;
if(!url)throw new Error("Set LEGACY_DB_URL before exporting legacy records.");
const connection=await mysql.createConnection(url);
const data:Record<string,unknown[]>={};
try{
  for(const table of tables){
    try{const [rows]=await connection.query(`SELECT * FROM \`${table}\``);data[table]=rows as unknown[];}
    catch(error){const code=(error as {code?:string}).code;if(code==="ER_NO_SUCH_TABLE"){data[table]=[];continue;}throw error;}
  }
}finally{await connection.end();}
const dir=join(process.cwd(),"migration-export");await mkdir(dir,{recursive:true});
const output=join(dir,"legacy-export.json");await writeFile(output,JSON.stringify({exportedAt:new Date().toISOString(),tables:data},null,2),{encoding:"utf8",flag:"wx"}).catch(async error=>{if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;await writeFile(output,JSON.stringify({exportedAt:new Date().toISOString(),tables:data},null,2),"utf8");});
process.stdout.write(`Exported ${Object.values(data).reduce((n,rows)=>n+rows.length,0)} rows to ${output}\n`);
