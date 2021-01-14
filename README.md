# free-sql

如果你习惯于 MySQL 的生态，习惯于 SQL 查询，但是又向往 Mongodb 的无模式，动态创建表，不需要维护字段，使用 free-sql 就可以满足你的幻想。

free-sql 可以帮助你在 MySQL 插入的过程中，自动创建表、字段。

free-sql 特别适合多租户类型的项目

document: [https://free-sql.writeflowy.com/](https://free-sql.writeflowy.com/)

> Use mysql2/promise

- 给 SQL 添加 NoSQL 的风格，自动创建表和字段
- 内置一系列钩子，可以根据条件自定义类型和忽略某些情况的 NoSQL
- 优雅添加索引
- 自动类型推导
- 暂时只支持 mysql

## Install

```
$ yarn add free-sql
```

## Use

```ts
import Mysql from 'mysql2/promise';
import freeSQL from 'free-sql'

// 创建 mysql 连机器或连接池
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "...",
  database: "..."
});

// 对 mysql 连接器进行处理
const db = freeSQL(pool);

async function start(){
  // 使用默认的 db.query 语句，会提示错误，user 表不存在
  await db.query('INSERT INTO user (name, age) VALUES ("dog", 20)');
  // 使用扩展的 db.free 语句，会自动创建表或字段，并进行
  await db.free('INSERT INTO user (name, age) VALUES ("dog", 20)');
}

start();
```

## 基础表

以下是自动创建的基础表，后续的自动创建字段会在基础表中自动添加

```sql
CREATE TABLE `table` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8
```

## 自动创建字段：类型推导

根据 `VALUES ("dog", 20, 1.3, "2020-12-20")` 等内容，默认情况做如下推导：

- string 类型: 根据插入的长度 * 4 判定在 128 - 65500 的某个2的平方区间
- boolean 类型: TINYINT
- number 类型，若有小数点: FLOAT
- number 类型，若无小数点: INT
- 时间字符串, 若有小数点: TIMESTAMP
- 时间字符串, 若无小数点: DATETIME

## 自动添加索引

当自动添加字段时，解析到以下类型，会自动添加索引：

- VARCHAR 小于等于 128 长度
- TIMESTAMP
- DATETIME
- INT
- TINYINT

取消自动添加索引：

```ts
// 取消个别表
freeSQL.setFreeSQLConfig({
  ignoreAutoIndex:['user', 'page']
})

// 取消所有表
freeSQL.setFreeSQLConfig({
  ignoreAutoIndex:['*']
})
```


## 自定义字段

alter 方法可以优雅的在插入表时或自动创建字段时，自定义字段或索引

```ts

await db.createTableDetail('user', [
  'age tinyint',
  'vip varchar(64)',
  'key vip(vip)',
  'unique(name)'
])

// 自动创建表和字段，并进行insert
await db.free('INSERT INTO user (name, age, vip) VALUES (?, ?, ?)', ["dog", 20, 50]);
```

## 配置

```ts
freeSQL.setFreeSQLConfig({
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
});
```

## 和 ORM 定义类有什么区别？

1. free-sql 保持原始的 SQL 脚本，更适合喜欢编写原始 SQL 的开发者
2. ORM 种类繁多，遇到复杂情况，往往最后还是会回归到编写 SQL 语句