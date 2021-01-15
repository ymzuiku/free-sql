import { parseSQL } from "./hepler";
import { safeFree, safeQuery } from "./safeQuery";
import { autoAlter, autoTable } from "./sql";
import { table } from "./table";
import { columns } from "./columns";
const sqlstring = require("sqlstring");

interface FreeSQL {
  free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  table: typeof table;
  columns: typeof columns;
}

const unknownColumn = /Unknown column/;
const notExitsTable = /Table (.+?)doesn\'t exist/;

const freeSQL = <T>(connector: T): FreeSQL & T => {
  const db = connector as any;
  db.free = async (sql: string, sqlValues?: any[]): Promise<any> => {
    let err: Error;
    try {
      const out = await db.query(sql, sqlValues);
      return out;
    } catch (error) {
      err = error;
    }
    const errString = err.toString();
    let low = sqlstring.format(sql, sqlValues);

    if (notExitsTable.test(errString)) {
      await autoTable(db, parseSQL(low));
    } else if (unknownColumn.test(errString)) {
      await autoAlter(db, parseSQL(low));
    }
    return await db.query(sql, sqlValues);
  };

  db.safeFree = (a: string, b: any[]) => safeFree(db, a, b);
  db.safeQuery = (a: string, b: any[]) => safeQuery(db, a, b);
  db.table = table;
  db.columns = columns;
  return db;
};

export default freeSQL;
