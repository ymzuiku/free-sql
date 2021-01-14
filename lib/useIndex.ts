export const useIndexCache = {} as { [key: string]: string[] };

export const useIndex = (table: string, query: string[]) => {
  useIndexCache[table] = query.filter(Boolean);
};
