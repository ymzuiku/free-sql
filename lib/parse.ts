import { config } from "./config";

export const lowSQL = (sql: string) => {
  let low = sql.toLocaleLowerCase();
  low = low.replace(/   /g, " ");
  low = low.replace(/\n/g, " ");
  low = low.replace(/  /g, " ");
  return low;
};

export const getMatch = (str: string, reg: RegExp) => {
  const match = str.match(reg);
  if (match && match[1]) {
    return match[1].trim();
  }
  return "";
};

const getTable = (str: string) => {
  const out = getMatch(str, /into(.+?)\(/);
  return out.replace(/\`/g, "");
};

const getColumns = (str: string, table: string) => {
  let out = getMatch(str, new RegExp(`${table}(.+?)values`));
  out = out.replace(/(\`|\(|\))/g, "");
  return out.split(",").map((v) => v.trim());
};

const getValues = (str: string) => {
  let out: any = getMatch(str, /values(.+?)\)/);
  out = out.replace(/(\(|\))/g, "");

  // 无引号，是数字，尝试转化为 number
  // if (!/(\"|\')/.test(out)) {
  //   // 若有小数点，不进行转化
  //   if (out.indexOf(".") !== -1) {
  //     const n = Number(out);
  //     out = isNaN(n) ? out : n;
  //   }
  // } else {
  //   // 若有引号，是字符串
  //   out = out.replace(/(\"|\')/g, "");
  // }
  return out.split(",").map((v: any) => v.trim());
};

export const parseInsert = (str: string) => {
  const table = getTable(str);
  const columns = getColumns(str, table);
  const values = getValues(str);
  return { table, columns, values };
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

export const getColMap = async (db: any, str: string) => {
  const { table, columns, values } = parseInsert(str);
  const colMap = {} as { [key: string]: string };
  columns.forEach((k, i) => {
    let v = values[i];
    let isNumber = false;
    if (!/(\"|\')/.test(v)) {
      isNumber = true;
    }
    v = v.replace(/(\"|\')/g, "");
    let kind = "VARCHAR(255)";
    if (isNumber) {
      if (v.indexOf(".") > -1) {
        kind = config.focusDoubleType ? "DOUBLE" : "FLOAT";
      } else {
        kind = "INT";
      }
    } else if (isDate(v)) {
      if (v.indexOf(".") > -1) {
        kind = "TIMESTAMP";
      } else {
        kind = "DATETIME";
      }
    } else if (v === "true" || v === "false") {
      kind = "TINYINT";
    } else {
      const len = Math.max(
        getVarcharLenth(v.length * (config.varcharRate || 4)),
        config.varcharMinLength || 255
      );
      if (len < 65535) {
        kind = `VARCHAR(${len})`;
      } else {
        kind = `TEXT`;
      }
    }
    colMap[k] = kind;
  });

  if (db) {
    const keySet = new Set(columns);
    const [list] = (await db.query("show full columns from " + table)) as any;
    list.forEach((item: any) => {
      const name = item.Field;
      if (keySet.has(name)) {
        delete colMap[name];
      }
    });
  }

  return { colMap, table, values, columns };
};

const isDate = (str: string) => {
  return isNaN(Number(str)) && !isNaN(Date.parse(str));
};
