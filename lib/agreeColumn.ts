export const declareColumnCache = {} as { [key: string]: string[] };

// declare
export const declareColumn = (table: string, query: string | string[]) => {
  if (typeof query === "string") {
    query = [query];
  }
  declareColumnCache[table] = query.filter(Boolean);
};
