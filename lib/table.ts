export const declareTableCache = {} as { [key: string]: string[] };

// declare
export const table = (table: string, query: (string | string[])[]) => {
  const list = new Set<string>();
  query.forEach((item) => {
    if (typeof item === "string") {
      if (item) {
        list.add(item);
      }
    } else {
      item.forEach((v) => {
        if (v) {
          list.add(v);
        }
      });
    }
  });
  declareTableCache[table] = Array.from(list);
};
