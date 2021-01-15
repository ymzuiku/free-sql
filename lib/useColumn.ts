export const useTypeCache = {} as {
  [key: string]: string;
};

export const useColumn = (tableAndColumn: string, type: string) => {
  useTypeCache[tableAndColumn] = type;
};
