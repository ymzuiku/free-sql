export const safeFree = async (
  db: any,
  sql: string,
  sqlValues?: string[]
): Promise<any[]> => {
  try {
    const out = await db.free(sql, sqlValues);
    return out;
  } catch (err) {
    return [];
  }
};

export const safeQuery = async (
  db: any,
  sql: string,
  sqlValues?: string[]
): Promise<any[]> => {
  try {
    const out = await db.query(sql, sqlValues);
    return out;
  } catch (err) {
    return [];
  }
};
