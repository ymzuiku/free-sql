export const safeQuery = async (
  db: any,
  sql: string,
  sqlValues?: string[]
): Promise<any[]> => {
  try {
    const out = await db.insert(sql, sqlValues);
    return out;
  } catch (err) {
    return [];
  }
};
