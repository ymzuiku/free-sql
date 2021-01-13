export const beforeAlterTableCache = {} as { [key: string]: string[] };

export const onBeforeAlterTable = (table: string, querys: string[]) => {
  beforeAlterTableCache[table] = querys;
};
