import { config } from "./config";
import { parseSQLHelper } from "./hepler";

const isDate = (str: string) => {
  return isNaN(Number(str)) && !isNaN(Date.parse(str));
};

function getVarcharLenth(len: number): number {
  const resize = (next: number): number => {
    if (next > 65500) {
      return 65500;
    }
    if (len < next) {
      return next;
    }
    return resize(next * 2);
  };
  return resize(64) as number;
}

export const parseSQL = async (db: any, str: string) => {
  const ast = parseSQLHelper(str);
  const colMap = {} as { [key: string]: string };
  const cols = Object.keys(ast.columns);
  cols.forEach((k) => {
    const item = ast.columns[k as any];
    if (item.type === "bool") {
      item.type = "TINYINT(1)";
    } else if (item.type === "string") {
      if (item.value === "true" || item.value === "false") {
        item.type = "TINYINT(1)";
      } else if (isDate(item.value)) {
        item.type = config.focusTimeType || "DATETIME";
      } else {
        const len = Math.max(
          getVarcharLenth(item.value.length * (config.varcharRate || 4)),
          config.varcharMinLength || 128
        );
        if (len < 65535) {
          item.type = `VARCHAR(${len})`;
        } else {
          item.type = `TEXT`;
        }
      }
    }
    if (item.type === "number") {
      if (String(item.value).indexOf(".") > -1) {
        item.type = config.focusDoubleType || "FLOAT";
      } else {
        item.type = "INT";
      }
    }
  });

  if (db) {
    const keySet = new Set(Object.keys(ast.columns));
    const [list] = (await db.query(
      "show full columns from " + ast.table
    )) as any;
    list.forEach((item: any) => {
      const name = item.Field;
      if (keySet.has(name)) {
        delete colMap[name];
      }
    });
  }

  return ast;
};
