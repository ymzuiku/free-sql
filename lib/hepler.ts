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

const { Parser } = require("node-sql-parser/build/mysql");

export interface IColumn {
  operator?: string;
  value: any;
  type: string;
}

export interface ParseSQL {
  type: string;
  db: string;
  table: string;
  columns: {
    [key: string]: IColumn;
  };
}

// export const parseAlterHelper = (sql: string) => {};

export const parseSQLHelper = (sql: string): ParseSQL => {
  const parse = new Parser();
  let ast: any;
  try {
    ast = parse.astify(sql);
  } catch (err) {
    throw err;
  }

  const type = ast.type;
  let details: any;
  let db: any;
  let table: any;

  try {
    if (type === "update" || type === "insert") {
      details = ast.table;
    } else if (type === "select") {
      details = ast.from;
    }
    db = details[0].db;
    table = details[0].table;
  } catch (err) {
    throw "[free-sql] error get table and db";
  }

  if (!table) {
    throw "[free-sql] error get table";
  }

  try {
    const columns = {} as { [key: string]: IColumn };

    const isSelfTable = (table: string) => {
      if (!table) {
        if (details.length === 1) {
          return true;
        }
        return false;
      }

      const item = details[0];
      return item.table == table || item.as == table;
    };

    if (ast.set) {
      ast.set.forEach((item: any) => {
        if (isSelfTable(item.table)) {
          columns[item.column] = {
            type: item.value.type,
            value: item.value.value,
          };
        }
      });
    }

    const loadLeftAndRight = (obj: any) => {
      if (!obj) {
        return;
      }
      if (!obj.left.column) {
        loadLeftAndRight(obj.left);
        loadLeftAndRight(obj.right);
      } else {
        if (isSelfTable(obj.left.table)) {
          if (obj.right.type !== "column_ref" && obj.right.value !== void 0) {
            columns[obj.left.column] = {
              operator: obj.operator as string,
              type: obj.right.type,
              value: obj.right.value,
            };
          }
        }
      }
    };

    if (ast.where) {
      loadLeftAndRight(ast.where);
    }
    details.forEach((item: any) => {
      if (item.on) {
        loadLeftAndRight(item.on);
      }
    });

    if (type === "insert") {
      if (ast.columns && ast.values && ast.values[0] && ast.values[0].value) {
        ast.columns.forEach((k: string, i: number) => {
          const v = ast.values[0].value[i];
          if (v.value !== void 0) {
            columns[k] = v;
          }
        });
      }
    }

    return { type, db, table, columns };
  } catch (err) {
    throw "[free-sql] parse error: " + sql;
  }
};
