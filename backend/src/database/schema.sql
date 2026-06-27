-- 《先别开工》数据库表结构
-- 新野兽派 AI 任务需求防返工扫描仪
--
-- 约定：
-- - 表名 snake_case 复数
-- - 字段名 snake_case
-- - 主键统一 id
-- - 外键 <表名单数>_id
-- - 布尔用 INTEGER (0/1)
-- - 时间用 TEXT (ISO 8601)
-- - JSON 用 TEXT 存 JSON 字符串

-- ===== 用户表 =====
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar        VARCHAR(255),
  scan_count    INTEGER      DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ===== 游客会话表 =====
-- 游客每日扫描次数限制通过 last_scan_at + scan_count 判断
-- 每日 0 点重置 scan_count（在 incrementGuestScanCount 中判断）
CREATE TABLE IF NOT EXISTS guest_sessions (
  id            VARCHAR(32) PRIMARY KEY,
  scan_count    INTEGER     DEFAULT 0,
  last_scan_at  DATETIME,
  created_at    DATETIME    DEFAULT CURRENT_TIMESTAMP
);

-- ===== 扫描记录表 =====
-- 一条扫描记录对应一次任务扫描分析
-- user_id 与 guest_id 二选一（登录用户 / 游客）
CREATE TABLE IF NOT EXISTS scan_records (
  id            VARCHAR(32)  PRIMARY KEY,
  user_id       INTEGER,                       -- NULL 表示游客
  guest_id      VARCHAR(32),                   -- 游客 ID
  identity      VARCHAR(20)  NOT NULL,         -- 扫描身份
  task_text     TEXT         NOT NULL,         -- 任务原文
  score         INTEGER,                       -- 风险评分 0-100
  risk_level    VARCHAR(10),                   -- high / mid / low
  result_json   TEXT,                          -- 完整结果 JSON 字符串
  is_favorite   INTEGER      DEFAULT 0,        -- 是否收藏
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ===== 分享表 =====
-- 用户可将扫描结果生成分享链接，供他人只读查看
-- expire_at 为 NULL 表示永久有效
CREATE TABLE IF NOT EXISTS shares (
  id            VARCHAR(16)  PRIMARY KEY,      -- 短 ID，便于分享
  scan_id       VARCHAR(32)  NOT NULL,         -- 关联扫描记录
  user_id       INTEGER      NOT NULL,         -- 创建者（仅登录用户可创建）
  expire_at     DATETIME,                      -- NULL 表示永久有效
  view_count    INTEGER      DEFAULT 0,        -- 浏览次数
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ===== 索引 =====
-- users.username / users.email 已声明 UNIQUE NOT NULL，SQLite 自动创建唯一索引，无需重复建普通索引
CREATE INDEX IF NOT EXISTS idx_guest_sessions_last_scan ON guest_sessions(last_scan_at);
CREATE INDEX IF NOT EXISTS idx_scan_records_user_id ON scan_records(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_guest_id ON scan_records(guest_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_created_at ON scan_records(created_at);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_scan_id ON shares(scan_id);
