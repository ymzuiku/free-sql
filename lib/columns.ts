export const columns = {
  id: ["id int unsigned NOT NULL AUTO_INCREMENT", "primary key id"],
  id_TINYINT: ["id TINYINT unsigned NOT NULL AUTO_INCREMENT", "primary key id"],
  id_BIGINT: ["id BIGINT unsigned NOT NULL AUTO_INCREMENT", "primary key id"],
  create_at: "create_at datetime DEFAULT CURRENT_TIMESTAMP",
  create_at_TIMESTAMP: "create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  update_at:
    "update_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  update_at_TIMESTAMP:
    "update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
};
