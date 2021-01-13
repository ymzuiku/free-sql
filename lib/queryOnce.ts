// import crypto from "crypto";
// import { onCreateTable } from "./onCreateTable";
// export const onceCache = {} as { [key: string]: string };

// export const sha256 = (str: string) => {
//   const obj = crypto.createHash("sha256");
//   obj.update(str);

//   return obj.digest("hex");
// };

// export default function queryOnce(this: any, sql: string) {
//   sql = sha256(sql);
//   if (onceCache[sql]) {
//     return;
//   }
//   onCreateTable("noschema_lock", ["unique(sql)"]);
//   try {
//     await this.query("insert into noschema_lock (sql) values (?)", [sql]);
//     if (onceCache[sql]) {
//     }
//   } catch (err) {

//   }
// }
