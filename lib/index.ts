import { config, setConfig } from "./config";
import { getColMap, lowSQL } from "./parse";
import { autoAlter, autoTable } from "./sql";
import { createTableDetail } from "./createTableDetail";
import { onAfterAlterTable } from "./onAfterAlterTable";
import { alter, alterBase } from "./alter";
import {
  onBeforeAlterTable,
  beforeAlterTableCache,
} from "./onBeforeAlterTable";
import {
  onAfterCreateTable,
  afterCreateTableCache,
} from "./onAfterCreateTable";
import { createDbAndUser, CreateDbAndUserOpt } from "./createDbAndUser";
import { safeQuery } from "./safeQuery";

const insertReg = /(insert into (.+?)values)/;
const updateReg = /(update (.+?) set)/;
const selectReg = /select (.+?) from/;

interface NoSchemaDb<T> {
  connector: T;
  query: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
  alter: (sql: string, sqlValue?: any[]) => void;
  alterBase: (sql: string, sqlValue?: any[]) => void;
  createTableDetail: typeof createTableDetail;
  onAfterCreateTable: typeof onAfterCreateTable;
  onBeforeAlterTable: typeof onBeforeAlterTable;
  onAfterAlterTable: typeof onAfterAlterTable;
  setConfig: typeof setConfig;
  createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
}

const freeSQL = <T>(connector: T): NoSchemaDb<T> => {
  const db = connector as any;
  const free = async (sql: string, sqlValues?: any[]): Promise<any> => {
    let err: Error;
    try {
      const out = await db.query(sql, sqlValues);
      return out;
    } catch (error) {
      err = error;
    }

    let low = lowSQL(sql);
    let sqlType: any;
    if (insertReg.test(low)) {
      sqlType = "insert";
    } else if (selectReg.test(low)) {
      sqlType = "select";
    } else if (updateReg.test(low)) {
      sqlType = "update";
    } else {
      throw err;
    }

    if (sqlValues) {
      sqlValues.forEach((v: any) => {
        if (Object.prototype.toString.call(v) === "[object Date]") {
          low = low.replace("?", '"' + v.toISOString() + '"');
        }
        if (typeof v === "string") {
          if (low.split("?")[0].indexOf("values")) {
            low = low.replace("?", '"' + v + '"');
          } else {
            low = low.replace("?", "`" + v + "`");
          }
        } else {
          low = low.replace("?", v);
        }
      });
    }
    const errStr = err.toString();

    if (/Unknown column/.test(errStr)) {
      // 自动创建列
      let { colMap, table, values, columns } = await getColMap(
        sqlType,
        db,
        low
      );
      if (config.ignoreNoSchema) {
        if (
          await Promise.resolve(
            config.ignoreNoSchema({
              type: "alteColumns",
              error: err,
              values,
              columns,
              sql,
              sqlValues,
              table,
              colMap,
            })
          )
        ) {
          throw err;
        }
      }
      // 若有 befault，就先添加列
      const _beforeAlter = beforeAlterTableCache[table];
      if (_beforeAlter) {
        await Promise.resolve(_beforeAlter());
        // 更新缺少的列
        colMap = (await getColMap(sqlType, db, low)).colMap;
      }
      // 添加剩余的列
      await autoAlter(db, table, colMap);
      return free(sql, sqlValues);
    }
    if (/doesn\'t exist/.test(errStr) && /Table/.test(errStr)) {
      // 自动创建表 和 列
      let { colMap, table, values, columns } = await getColMap(
        sqlType,
        null,
        low
      );
      if (config.ignoreNoSchema) {
        if (
          await Promise.resolve(
            config.ignoreNoSchema({
              type: "createTable",
              error: err,
              values,
              columns,
              sql,
              sqlValues,
              table,
              colMap,
            })
          )
        ) {
          throw err;
        }
      }

      await autoTable(db, table);
      const { colMap: c2 } = await getColMap(sqlType, db, low);
      await autoAlter(db, table, c2);
      const _afterCreate = afterCreateTableCache[table];
      if (_afterCreate) {
        await Promise.resolve(_afterCreate());
      }
      return free(sql, sqlValues);
    }

    throw err;
  };

  const out = {
    free,
    query: (a: string, b?: any[]) => (connector as any).query(a, b),
    connector,
    safeQuery: (a: string, b?: any[]) => safeQuery(free, a, b),
    onAfterAlterTable,
    onAfterCreateTable,
    onBeforeAlterTable,
    createTableDetail,
    setConfig,
    createDbAndUser: (opt: any) => createDbAndUser(out, opt),
    alter: (a: string, b?: any[]) => alter(out, a, b),
    alterBase: (a: string, b?: any[]) => alterBase(out, a, b),
  };

  return out;
};

export default freeSQL;
