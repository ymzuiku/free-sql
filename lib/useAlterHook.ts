export const alterTableDetailCache = {} as { [key: string]: string[] };

export const useAlterHook = (table: string, columns: string[]) => {
  alterTableDetailCache[table] = columns;
};
