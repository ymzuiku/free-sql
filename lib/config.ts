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
  colMap: { [key: string]: string };
}

export interface NoSchemaOpt {
  /** 判断哪些情况忽略 NoSchema */
  ignoreNoSchema?: (checker: CheckerOptions) => any;
  /** 忽略默认字段 id 的 tableNames */
  ignoreId: string[];
  /** 忽略默认字段 create_at 的 tableNames */
  ignoreCreateAt: string[];
  /** 忽略默认字段 update_at 的 tableNames */
  ignoreUpdateAt: string[];
  /** 浮点数的类型 ，默认为 Float  */
  focusDoubleType?: string;
  /** 时间的类型, 默认为 DATETIME */
  focusTimeType?: string;
  /** 主键名称，默认为 id */
  primaryKey?: string;
  /** 某些表忽略自动创建索引 */
  ignoreAutoIndex: string[];
  /** string 类型默认创建 varchar 最小值, 默认为 128, 同时也是 varchar 自动创建索引的尺寸依据 */
  varcharMinLength?: number;
  /** 根据首次插入的长度 * varcharRate 来判定 varchar 区间, 默认为 4 倍, 最后会和 varcharMinLength 之间取最大值，并且计算为2的次方*/
  varcharRate?: number;
}

export const config = {
  ignoreId: [],
  ignoreCreateAt: [],
  ignoreUpdateAt: [],
  ignoreAutoIndex: [],
  autoDropTable: {},
} as NoSchemaOpt;

export const setConfig = (next: Partial<NoSchemaOpt>) => {
  Object.assign(config, next);
};
