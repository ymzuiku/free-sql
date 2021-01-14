# noschema

如果你习惯于 MySQL 的生态，习惯于 SQL 查询，但是又向往 Mongodb 的无模式，动态创建表，不需要维护字段，使用 noschema 就可以满足你的幻想。

noschema 可以帮助你在 MySQL 插入的过程中，自动创建表、字段。

noschema 特别适合多租户类型的项目

document: [https://noschema.writeflowy.com/](https://noschema.writeflowy.com/)

> Use mysql2/promise

- 给 SQL 添加 NoSQL 的风格，根据 insert 语句 自动创建表和字段
- 内置一系列钩子，可以根据条件自定义类型和忽略某些情况的 NoSQL
- 优雅添加索引
- 自动类型推导
- 暂时只支持 mysql

## Install

```
$ yarn add noschema
```

## Use

```ts
import Mysql from 'mysql2/promise';
import noschema from 'noschema'

// 创建 mysql 连机器或连接池
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "...",
  database: "..."
});

// 对 mysql 连接器进行处理
const db = noschema(pool);

async function start(){
  // 使用默认的 db.query 语句，会提示错误，user 表不存在
  await db.query('INSERT INTO user (name, age) VALUES ("dog", 20)');
  // 使用扩展的 db.insert 语句，会自动创建表或字段，并进行 insert
  await db.insert('INSERT INTO user (name, age) VALUES ("dog", 20)');
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
noschema.setConfig({
  ignoreAutoIndex:['user', 'page']
})

// 取消所有表
noschema.setConfig({
  ignoreAutoIndex:['*']
})
```


## 自定义索引

alter 方法可以优雅的自定义索引，我们添加了一些条件，在表体长度不大时，可以编写在代码上下文，而不需要去连接数据库操作。

```ts
// 自动创建表和字段，并进行insert
await db.insert('INSERT INTO user (name, age) VALUES (?, ?)', ["dog", 20]);

// 该方法若执行时，会在内存中添加锁，程序的生命周期中仅执行一次
// 若该方法执行结果失败，会清除内存中的锁
// 执行前会查询添加索引的表，判定若无同名索引，则开始添加索引
// 仅允许执行 alter table add index/unique
// 不锁表加索引，相当于：ALGORITHM=INPLACE, LOCK = NONE
db.alter('alter table add index index_age(age)');

// 忽略：ALGORITHM=INPLACE, LOCK = NONE
db.alterBase('alter table add index index_age(age)');
```

## 配置

```ts
noschema.setConfig({
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
});
```

## 和 ORM 定义类有什么区别？

1. noschema 保持原始的 SQL 脚本，更适合喜欢编写原始 SQL 的开发者
2. ORM 种类繁多，遇到复杂情况，往往最后还是会回归到编写 SQL 语句