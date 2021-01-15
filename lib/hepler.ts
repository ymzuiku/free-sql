const { Parser } = require("node-sql-parser/build/mysql");

export interface ParseSQL {
  type: string;
  db: string;
  table: string;
}

export const parseSQL = (sql: string): ParseSQL => {
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

  if (type !== "update" && type !== "insert" && type !== "select") {
    throw "[free-sql] only declare: update insert select";
  }

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

  return { type, db, table };
};
