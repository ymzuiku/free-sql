import { config } from "./config";

const isDate = (str: string) => {
  return isNaN(Number(str)) && !isNaN(Date.parse(str));
};

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

const parse = {
  insert: (str: string) => {
    let table = getMatch(str, /into(.+?)\(/);
    table = table.replace(/\`/g, "");

    let columns: any = getMatch(str, new RegExp(`${table}(.+?)values`));
    columns = columns.replace(/(\`|\(|\))/g, "");
    columns = columns.split(",").map((v: any) => v.trim());

    let values: any = getMatch(str, /values(.+?)\)/);
    values = values.replace(/(\(|\))/g, "");
    values = values.split(",").map((v: any) => v.trim());

    return { table, columns, values };
  },
  update: (str: string) => {
    // update table set name=''
    let table = getMatch(str, /update (.+?) set/);
    table = table.replace(/\`/g, "");

    let columns: any = getMatch(str, new RegExp(`${table}(.+?)values`));
    columns = columns.replace(/(\`|\(|\))/g, "");
    columns = columns.split(",").map((v: any) => v.trim());

    let values: any = getMatch(str, /values(.+?)\)/);
    values = values.replace(/(\(|\))/g, "");
    values = values.split(",").map((v: any) => v.trim());

    return { table, columns, values };
  },
  select: (str: string) => {
    let table = getMatch(str, /into(.+?)\(/);
    table = table.replace(/\`/g, "");

    let columns: any = getMatch(str, new RegExp(`${table}(.+?)values`));
    columns = columns.replace(/(\`|\(|\))/g, "");
    columns = columns.split(",").map((v: any) => v.trim());

    let values: any = getMatch(str, /values(.+?)\)/);
    values = values.replace(/(\(|\))/g, "");
    values = values.split(",").map((v: any) => v.trim());

    return { table, columns, values };
  },
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

export const getColMap = async (
  type: "insert" | "update" | "select",
  db: any,
  str: string
) => {
  const { table, columns, values } = parse[type](str);
  const colMap = {} as { [key: string]: string };
  columns.forEach((k: string, i: number) => {
    let v = values[i];
    let isNumber = false;
    if (!/(\"|\')/.test(v)) {
      isNumber = true;
    }
    v = v.replace(/(\"|\')/g, "");
    let kind = "VARCHAR(128)";
    if (v === "true" || v === "false") {
      kind = "TINYINT";
    } else if (isNumber) {
      if (v.indexOf(".") > -1) {
        kind = config.focusDoubleType || "FLOAT";
      } else {
        kind = "INT";
      }
    } else if (isDate(v)) {
      kind = config.focusTimeType || "DATETIME";
    } else {
      const len = Math.max(
        getVarcharLenth(v.length * (config.varcharRate || 4)),
        config.varcharMinLength || 128
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
