import { getMatch, lowSQL } from "./parse";

const cache = {} as any;
const alterReg = /alter(.+?)table(.+?)add/;

export const alter = function (connector: any, sql: string, sqlValues: any[]) {
  sql += ", ALGORITHM=INPLACE, LOCK = NONE;";
  return alterBase(connector, sql, sqlValues);
};

export const alterBase = function (
  connector: any,
  sql: string,
  sqlValues: any[]
) {
  let low = lowSQL(sql);
  if (cache[sql]) {
    return;
  }
  if (!alterReg.test(low) || !/(index|unique)/.test(low)) {
    throw "alter only run ALTER TABLE ADD INDEX/UNIQUE";
  }
  cache[sql] = 1;
  const start = async () => {
    const table = getMatch(low, /alter table (.+?) add/);
    const index =
      getMatch(low, /unique\((.+?)\)/) || getMatch(low, /add index(.+?)\(/);
    const [list] = await connector.query("show index from " + table);
    if (index) {
      list.forEach((item: any) => {
        if (item.Column_name === index) {
          cache[sql] = 2;
          return;
        }
      });
    }

    try {
      await connector.query(sql, sqlValues);
    } catch (error) {
      const err = error.toString();
      if (/Duplicate key name/.test(err)) {
        cache[sql] = 2;
      } else {
        console.error(err);
        cache[sql] = 0;
      }
    }
  };
  start();
};
