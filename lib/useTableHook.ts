export const createTableDetailCache = {} as { [key: string]: string[] };

export const useTableHook = (table: string, columns: string[]) => {
  createTableDetailCache[table] = columns;
};