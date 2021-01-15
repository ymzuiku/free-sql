export const declareTableCache = {} as { [key: string]: string[] };

// declare
export const table = (table: string, query: (string | string[])[]) => {
  const list = [] as string[];
  query.forEach((item) => {
    if (typeof item === "string") {
      if (item) {
        list.push(item);
      }
    } else {
      item.forEach((v) => {
        if (v) {
          list.push(v);
        }
      });
    }
  });
  declareTableCache[table] = list;
};
