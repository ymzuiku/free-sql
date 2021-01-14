export const createTableDetailCache = {} as { [key: string]: string[] };

export const onCreateTableDetail = (table: string, columns: string[]) => {
  createTableDetailCache[table] = columns;
};
