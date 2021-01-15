import { parseSQL } from "./parseSQL";
import { safeFree, safeQuery } from "./safeQuery";
import { autoAlter, autoTable } from "./sql";
import { setConfig } from "./config";
import { createDbAndUser, CreateDbAndUserOpt } from "./createDbAndUser";
import { table } from "./table";
const sqlstring = require("sqlstring");

interface NoSchemaDb {
  free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
  table: typeof table;
  setFreeSQLConfig: typeof setConfig;
}

const unknownColumn = /Unknown column/;
const notExitsTable = /Table (.+?)doesn\'t exist/;

const freeSQL = <T>(connector: T): NoSchemaDb & T => {
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
      await autoTable(db, await parseSQL(null, low));
      await autoAlter(db, await parseSQL(db, low));
    } else if (unknownColumn.test(errString)) {
      await autoAlter(db, await parseSQL(db, low));
    }
    return await db.query(sql, sqlValues);
  };

  db.safeFree = (a: string, b: any[]) => safeFree(db, a, b);
  db.safeQuery = (a: string, b: any[]) => safeQuery(db, a, b);
  db.table = table;
  db.createDbAndUser = (a: any) => createDbAndUser(db, a);
  db.setFreeSQLConfig = setConfig;
  return db;
};

export default freeSQL;
