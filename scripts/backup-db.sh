#!/bin/bash
# SQLite 定期备份脚本
# 用法：由 crontab 每天 03:00 调用
# 示例 cron：0 3 * * * /www/wwwroot/xbgk/scripts/backup-db.sh >> /www/wwwroot/xbgk/backups/backup.log 2>&1
#
# 依赖：
# - xbgk-backend 容器内已安装 sqlite3 命令
# - 若容器内无 sqlite3，需改用 docker cp + better-sqlite3 离线备份方案

BACKUP_DIR=/www/wwwroot/xbgk/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

# 通过 Docker 执行 SQLite 在线备份（.backup 命令保证一致性，不锁库）
docker exec xbgk-backend sqlite3 /app/data/app.db ".backup '$BACKUP_DIR/app_$TIMESTAMP.db'"

# 检查备份是否成功
if [ -f "$BACKUP_DIR/app_$TIMESTAMP.db" ]; then
  echo "[$(date)] 备份成功: app_$TIMESTAMP.db"
else
  echo "[$(date)] 备份失败" >&2
  exit 1
fi

# 保留最近 7 天
find "$BACKUP_DIR" -name "app_*.db" -mtime +7 -delete

echo "[$(date)] 清理完成，保留最近 7 天备份"
