import { afterAlterTableCache } from "./onAfterAlterTable";
import { createTableDetailCache } from "./createTableDetail";
import { config } from "./config";

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

export const createTable = (name: string) => {
  const _create = createTableDetailCache[name] || [];
  const list = [...createTableColumns(name), ..._create];
  const line = list.join(`, `);
  return `create table if not exists ${name} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
};

const useIndexTypes = {
  TIMESTAMP: 1,
  DATETIME: 1,
  INT: 1,
  TINYINT: 1,
} as any;

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
  return useIndexTypes[type];
}

export const autoAlter = async (
  db: any,
  table: string,
  colMap: { [key: string]: string }
) => {
  const columns = Object.keys(colMap);
  for (const column of columns) {
    const type = colMap[column];
    const sql = `alter table ${table} add column ${column} ${type} `;
    await db.query(sql);
    const index = checkTypeUseIndex(table, type)
      ? `index ${column}(${column})`
      : "";
    if (index) {
      await db.query(`alter table ${table} add index ${column}(${column})`);
    }
  }
  for (const column of columns) {
    const _alter = afterAlterTableCache[table + "." + column];
    if (_alter) {
      await Promise.resolve(_alter());
    }
  }
};

export const autoTable = async (db: any, table: string) => {
  await db.query(createTable(table));
};
