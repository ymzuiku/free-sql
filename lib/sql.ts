import { createTableDetailCache } from "./useTableHook";
import { config } from "./config";
import { ParseSQL } from "./hepler";
import { alterTableDetailCache } from "./useAlterHook";

export const createTableColumns = (name: string) => {
  const id = config.primaryKey || "id";
  return [
    config.ignoreId!.indexOf(name) === -1 &&
      `${id} int unsigned NOT NULL AUTO_INCREMENT`,
    config.ignoreCreateAt!.indexOf(name) === -1 &&
      `create_at ${
        config.focusTimeType || "datetime"
      } DEFAULT CURRENT_TIMESTAMP`,
    config.ignoreUpdateAt!.indexOf(name) === -1 &&
      `update_at ${
        config.focusTimeType || "datetime"
      } DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    config.ignoreId!.indexOf(name) === -1 && `primary key(${id})`,
  ].filter(Boolean) as string[];
};

const useIndexTypes = ["TIMESTAMP", "DATETIME", "INT", "TINYINT"];

function checkTypeUseIndex(table: string, type: string) {
  if (
    config.ignoreAutoIndex.indexOf("*") === 0 ||
    config.ignoreAutoIndex.indexOf(table) > -1
  ) {
    return false;
  }
  type = type.toLocaleUpperCase();
  if (type.indexOf("VARCHAR") > -1) {
    const match = type.match(/\((.+?)\)/);
    if (match && match[1]) {
      const len = Number(match[1].trim());
      if (len <= (config.varcharMinLength || 128)) {
        return true;
      }
    }
    return false;
  }
  let isIndex = false;
  useIndexTypes.forEach((item) => {
    if (type.indexOf(item) === 0) {
      isIndex = true;
    }
  });
  return isIndex;
}

export const autoAlter = async (db: any, ast: ParseSQL) => {
  const columns = Object.keys(ast.columns);
  const table = ast.table;
  const _alter = alterTableDetailCache[table] || [];
  const sqls = [] as string[];

  for (const column of columns) {
    const type = ast.columns[column].type;
    const sql = `alter table ${table} add column ${column} ${type} `;
    sqls.push(sql);
  }

  for (const column of columns) {
    const type = ast.columns[column].type;
    if (checkTypeUseIndex(table, type)) {
      let isIgnore = false;
      _alter.forEach((str) => {
        let s = str.toLocaleLowerCase();
        const haveColumn = s.indexOf(column) > -1;
        if (haveColumn) {
          if (/alter(.+?)add(.+?)index (.+?)\(/.test(s)) {
            isIgnore = true;
          } else if (/alter(.+?)add(.+?)unique\(/.test(s)) {
            isIgnore = true;
          }
        }
      });

      if (!isIgnore) {
        sqls.push(`alter table ${table} add index ${column}(${column})`);
      }
    }
  }
  for (const s of sqls) {
    await db.query(s);
  }
  for (const s of _alter) {
    await db.query(s);
  }
};

export const createTable = (ast: ParseSQL) => {
  const table = ast.table;
  const _create = createTableDetailCache[table] || [];
  const columns = Object.keys(ast.columns);
  const alters = [] as string[];
  for (const column of columns) {
    const type = ast.columns[column].type;
    alters.push(`${column} ${type}`);
    let isIgnoreIndex = false;
    _create.forEach((str) => {
      let s = str.toLocaleLowerCase();
      const haveColumn = s.indexOf(column) > -1;
      if (haveColumn) {
        if (/key(.+?)\(/.test(s)) {
          isIgnoreIndex = true;
        } else if (/unique\(/.test(s)) {
          isIgnoreIndex = true;
        }
      }
    });
    if (!isIgnoreIndex && checkTypeUseIndex(table, type)) {
      alters.push(`KEY ${column}(${column})`);
    }
  }
  // for (const column of columns) {

  // }
  // 若自定义中已有该索引，取消添加index

  const list = [...createTableColumns(table), ..._create, ...alters];
  const line = list.join(`, `);
  return `create table if not exists ${table} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
};

export const autoTable = async (db: any, ast: ParseSQL) => {
  await db.query(createTable(ast));
};
