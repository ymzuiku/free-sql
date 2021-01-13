interface CheckerOptions {
    /** noSchema 执行类型 */
    type: "alteColumns" | "createTable";
    /** insert 捕获的错误 */
    error: Error;
    /** 执行的 sql */
    sql: string;
    /** 执行的 sql 参数 */
    sqlValues?: any[];
    /** insert 的 table */
    table: string;
    /** 当此 insert 获取的 columns  */
    columns: string[];
    /** 当此 insert 获取的 values  */
    values: string[];
    colMap: {
        [key: string]: string;
    };
}
export interface NoSchemaOpt {
    /** 判断哪些情况忽略 NoSchema */
    ignoreNoSchema?: (checker: CheckerOptions) => any;
    /** 当 Table 小于一定的长度，若插入的内容和表结构冲突，自动重新创建表，清空数据 */
    resetTableLimit?: {
        [key: string]: number;
    };
    /** 主键名称，默认为 id */
    primaryKey?: string;
    /** 列名正则匹配(不区分大小写)，自动添加唯一索引，默认为: /(id|key|unique)$/ 即 id key unique 结尾的字段名，自动添加唯一索引 */
    /** 忽略默认字段 id 的 tableNames */
    ignoreId?: string[];
    /** 忽略默认字段 create_at 的 tableNames */
    ignoreCreateAt?: string[];
    /** 忽略默认字段 update_at 的 tableNames */
    ignoreUpdateAt?: string[];
    /** 带小数点的 number 自动识别为 Double 的 tableNames，默认为 Float  */
    focusDoubleType?: string[];
    /** string 类型默认创建 varchar 最小值, 默认为 255 */
    varcharMinLength?: number;
    /** 根据首次插入的长度 * varcharRate 来判定 varchar 区间, 默认为 4 倍, 最后会和 varcharMinLength 之间取最大值 */
    varcharRate?: number;
}
export declare const config: NoSchemaOpt;
export declare const setConfig: (next: NoSchemaOpt) => void;
export {};
