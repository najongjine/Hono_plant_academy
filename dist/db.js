import { neon } from "@neondatabase/serverless";
let dburl = `postgres://neondb_owner:npg_UI5fz8xamDRX@ep-summer-cloud-a4fprrii-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`;
if (process?.env?.NODE_ENV?.includes("dev"))
    dburl = `postgres://neondb_owner:npg_UI5fz8xamDRX@ep-summer-cloud-a4fprrii-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`;
export const sql = neon(dburl);
