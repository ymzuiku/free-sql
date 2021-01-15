export const agreeColumnCache = {} as { [key: string]: string[] };

export const agreeColumn = (table: string, query: string | string[]) => {
  if (typeof query === "string") {
    query = [query];
  }
  agreeColumnCache[table] = query.filter(Boolean);
};
