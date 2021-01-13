export const afterCreateTableCache = {} as { [key: string]: string[] };

export const onAfterCreateTable = (table: string, querys: string[]) => {
  afterCreateTableCache[table] = querys;
};
