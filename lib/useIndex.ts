export const useIndexCache = {} as { [key: string]: string[] };

export const useIndex = (table: string, query: string | string[]) => {
  if (typeof query === "string") {
    query = [query];
  }
  useIndexCache[table] = query.filter(Boolean);
};
