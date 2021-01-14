export const useTypeCache = {} as {
  [key: string]: string;
};

export const useType = (tableAndColumn: string, type: string) => {
  useTypeCache[tableAndColumn] = type;
};
