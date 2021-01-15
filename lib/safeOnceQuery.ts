import crypto from "crypto";

export const sha256 = (str: string, slat = "base-slat") => {
  const obj = crypto.createHash("sha256");
  obj.update(str + (slat ? slat : ""));

  return obj.digest("hex");
};

const sqlstring = require("sqlstring");

const cache = {} as any;

export const safeOnceQuery = async (
  db: any,
  sql: string,
  sqlValues?: any[]
) => {
  if (!cache.runed) {
    db.table("free_sql_lock", ["id varchar(512) unique", db.columns.create_at]);
    cache.runed = true;
  }
  let low = sqlstring.format(sql, sqlValues);
  if (cache[low]) {
    return;
  }
  const id = sha256(low);
  const [
    list,
  ] = await db.free("select id from free_sql_lock where id=? limit 1", [id]);

  if (list.length) {
    return;
  }

  await db.safeQuery(sql, sqlValues);
  await db.safeQuery("insert into free_sql_lock (id) values (?)", id);
  cache[low] = true;
};
