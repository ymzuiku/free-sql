import { config, setConfig } from "./config";
import { parseInsert, getColMap, lowSQL } from "./parse";
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

const insertReg = /(insert into)/;

interface NoSchemaDb<T> {
  connector: T;
  query: (sql: string, sqlValue: any[]) => Promise<any[]>;
  insert: (sql: string, sqlValue: any[]) => Promise<any[]>;
  alter: (sql: string, sqlValue: any[]) => void;
  alterBase: (sql: string, sqlValue: any[]) => void;
  parseInsert: typeof parseInsert;
  createTableDetail: typeof createTableDetail;
  onAfterCreateTable: typeof onAfterCreateTable;
  onBeforeAlterTable: typeof onBeforeAlterTable;
  onAfterAlterTable: typeof onAfterAlterTable;
  setConfig: typeof setConfig;
  createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
}

const noschema = <T>(connector: T): NoSchemaDb<T> => {
  const db = connector as any;
  const insert = async (sql: string, sqlValues?: any[]): Promise<any> => {
    try {
      const out = await db.query(sql, sqlValues);
      return out;
    } catch (err) {
      let low = lowSQL(sql);
      if (!insertReg.test(low)) {
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
      err = err.toString();
      const createTable = async () => {
        // 自动创建表 和 列
        let { colMap, table, values, columns } = await getColMap(null, low);
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
        const { colMap: c2 } = await getColMap(db, low);
        await autoAlter(db, table, c2);
        const _afterCreate = afterCreateTableCache[table];
        if (_afterCreate) {
          await Promise.resolve(_afterCreate());
        }
        return insert(sql, sqlValues);
      };

      if (/Unknown column/.test(err)) {
        // 自动创建列
        let { colMap, table, values, columns } = await getColMap(db, low);
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
        if (config.useAutoDropTable) {
          // 自动重设置table
          const count =
            config.autoDropTable![table] || config.autoDropTable!["*"];
          if (count) {
            const [list] = (await db.query(
              `select * from ${table} limit ${count}`
            )) as any;
            if (list && list.length < count) {
              await db.query(`drop table ${table}`);
              return createTable();
            }
          }
        }

        // 若有 befault，就先添加列
        const _beforeAlter = beforeAlterTableCache[table];
        if (_beforeAlter) {
          await Promise.resolve(_beforeAlter());
          // 更新缺少的列
          colMap = (await getColMap(db, low)).colMap;
        }
        // 添加剩余的列
        await autoAlter(db, table, colMap);
        return insert(sql, sqlValues);
      }
      if (/doesn\'t exist/.test(err) && /Table/.test(err)) {
        return createTable();
      }
      throw err;
    }
  };

  const out = {
    insert,
    query: (...args: any[]) => (connector as any).query(...args),
    connector,
    parseInsert,
    onAfterAlterTable,
    onAfterCreateTable,
    onBeforeAlterTable,
    createTableDetail,
    setConfig,
    createDbAndUser: (opt: any) => createDbAndUser(out, opt),
    alter: (a: string, b: any[]) => alter(out, a, b),
    alterBase: (a: string, b: any[]) => alterBase(out, a, b),
  };

  return out;
};

export default noschema;
