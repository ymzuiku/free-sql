export declare const createTableColumns: (name: string) => string[];
export declare const createTable: (name: string) => string;
export declare const autoAlter: (db: any, table: string, colMap: {
    [key: string]: string;
}) => Promise<void>;
export declare const autoTable: (db: any, table: string) => Promise<void>;
