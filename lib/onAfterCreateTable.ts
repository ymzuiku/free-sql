export const afterCreateTableCache = {} as { [key: string]: Function };

export const onAfterCreateTable = (table: string, event: Function) => {
  afterCreateTableCache[table] = event;
};
