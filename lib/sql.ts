import { ParseSQL } from "./hepler";
import { declareTableCache } from "./table";

export const autoAlter = async (db: any, ast: ParseSQL) => {
  const table = ast.table;
  const _indexs = declareTableCache[table] || [];
  for (const s of _indexs) {
    const low = s.toLocaleLowerCase();
    if (/alter table/.test(low)) {
      await db.safeQuery(s);
    } else {
      await db.safeQuery(`alter table ${table} add ${s}`);
    }
  }
};

export const autoTable = async (db: any, ast: ParseSQL) => {
  const table = ast.table;
  const list = declareTableCache[table];
  const line = list.join(`, `);
  const sql = `create table if not exists ${table} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
  await db.query(sql);
};
