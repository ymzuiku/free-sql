export interface NoSchemaOpt {
    /** 忽略默认字段 id 的 tableNames */
    ignoreId: string[];
    /** 忽略默认字段 create_at 的 tableNames */
    ignoreCreateAt: string[];
    /** 忽略默认字段 update_at 的 tableNames */
    ignoreUpdateAt: string[];
    /** 某些表忽略自动创建索引 */
    ignoreAutoIndex: string[];
    /** 浮点数的类型 ，默认为 Float  */
    focusDoubleType?: string;
    /** 时间的类型, 默认为 DATETIME */
    focusTimeType?: string;
    /** 主键名称，默认为 id */
    primaryKey?: string;
    /** string 类型默认创建 varchar 最小值, 默认为 128, 同时也是 varchar 自动创建索引的尺寸依据 */
    varcharMinLength?: number;
    /** 根据首次插入的长度 * varcharRate 来判定 varchar 区间, 默认为 4 倍, 最后会和 varcharMinLength 之间取最大值，并且计算为2的次方*/
    varcharRate?: number;
}
export declare const config: NoSchemaOpt;
export declare const setConfig: (next: Partial<NoSchemaOpt>) => void;
