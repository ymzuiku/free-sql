export const beforeAlterTableCache = {} as { [key: string]: Function };

export const onBeforeAlterTable = (table: string, event: Function) => {
  beforeAlterTableCache[table] = event;
};
