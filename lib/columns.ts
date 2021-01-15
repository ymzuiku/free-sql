export const columns = {
  id: "id int unsigned NOT NULL AUTO_INCREMENT primary key",
  id_TINYINT: "id TINYINT unsigned NOT NULL AUTO_INCREMENT primary key",
  id_BIGINT: "id TINYINT unsigned NOT NULL AUTO_INCREMENT primary key",
  create_at: "create_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP",
  create_at_TIMESTAMP: "create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  update_at:
    "update_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  update_at_TIMESTAMP:
    "update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
};
