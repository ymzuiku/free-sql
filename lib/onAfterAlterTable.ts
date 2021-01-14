export const afterAlterTableCache = {} as { [key: string]: Function };

export const onAfterAlterTable = (table: string, event: Function) => {
  afterAlterTableCache[table] = event;
};
