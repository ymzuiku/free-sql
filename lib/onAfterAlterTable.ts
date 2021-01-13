export const afterAlterTableCache = {} as { [key: string]: string[] };

export const onAfterAlterTable = (table: string, querys: string[]) => {
  afterAlterTableCache[table] = querys;
};
