export const onCreateTableCache = {} as { [key: string]: string[] };

export const onCreateTable = (table: string, columns: string[]) => {
  onCreateTableCache[table] = columns;
};
