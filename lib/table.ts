export const declareTableCache = {} as { [key: string]: string[] };

// declare
export const table = (table: string, query: string | string[]) => {
  if (typeof query === "string") {
    query = [query];
  }
  declareTableCache[table] = query.filter(Boolean);
};
