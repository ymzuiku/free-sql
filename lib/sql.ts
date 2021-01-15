import { config } from "./config";
import { ParseSQL } from "./hepler";
import { useIndexCache } from "./useIndex";
import { useTypeCache } from "./useColumn";

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

  for (const column of columns) {
    const alterKey = ast.table + "." + column;
    const _sql = useTypeCache[alterKey];
    if (_sql) {
      await db.query(`alter table ${table} add column ${column} ` + _sql);
    } else {
      const type = ast.columns[column].type;
      const sql = `alter table ${table} add column ${column} ${type} `;
      await db.query(sql);
    }
  }

  const _indexs = useIndexCache[table] || [];
  for (const s of _indexs) {
    if (s.indexOf("unique(") > -1) {
      await db.query(`alter table ${table} add ${s}`);
    } else {
      await db.query(
        `alter table ${table} add ${s} , ALGORITHM=INPLACE, LOCK = NONE`
      );
    }
  }

  for (const column of columns) {
    const type = ast.columns[column].type;
    if (checkTypeUseIndex(table, type)) {
      await db.safeQuery(`alter table ${table} add index ${column}(${column})`);
    }
  }
};

export const createTable = (ast: ParseSQL) => {
  const table = ast.table;
  const list = [...createTableColumns(table)];
  const line = list.join(`, `);
  return `create table if not exists ${table} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
};

export const autoTable = async (db: any, ast: ParseSQL) => {
  await db.query(createTable(ast));
};
