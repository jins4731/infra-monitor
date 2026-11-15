CREATE TABLE IF NOT EXISTS resource (
  id          BIGINT PRIMARY KEY,
  type        VARCHAR(20)  NOT NULL,  -- CLUSTER / NODE / NAMESPACE / POD
  name        VARCHAR(100) NOT NULL,
  status      VARCHAR(20)  NOT NULL,  -- HEALTHY / WARNING / ERROR (필터용)
  phase       VARCHAR(30),            -- K8s 실제 상태: Running, CrashLoopBackOff ...
  parent_id   BIGINT,
  path        VARCHAR(100) NOT NULL,
  updated_at  TIMESTAMP    NOT NULL,
  cpu         INT,
  memory      INT,
  restarts    INT
);
CREATE INDEX IF NOT EXISTS idx_parent_status ON resource(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_status ON resource(status);
CREATE INDEX IF NOT EXISTS idx_name ON resource(name);
-- 전체 펼치기: WHERE path LIKE '/5112/%' (앞부분 일치라 인덱스 사용 가능)
CREATE INDEX IF NOT EXISTS idx_path ON resource(path);
-- 폴링: WHERE updated_at > ? (최근 바뀐 것만 범위 조회)
CREATE INDEX IF NOT EXISTS idx_updated_at ON resource(updated_at);