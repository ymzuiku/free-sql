export const createTableDetailCache = {} as { [key: string]: string[] };

export const createTableDetail = (table: string, columns: string[]) => {
  createTableDetailCache[table] = columns;
};
