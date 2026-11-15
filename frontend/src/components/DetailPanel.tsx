import { STATUS_COLOR } from '../constants';
import type { Resource } from '../types';
import { formatDateTime } from '../utils';

type Props = {
  resource: Resource | undefined; // 선택 안 했으면 undefined
  breadcrumb: string; // 상위 경로 (예: cluster-1 › cluster-1-node-2 › auth)
};

/** Presentational: 선택한 리소스 상세. 값이 null 인 항목은 그 리소스 종류에 해당하지 않으므로 숨긴다 */
const DetailPanel = ({ resource: r, breadcrumb }: Props) => {
  if (!r) {
    return (
      <aside className="detail">
        <p className="muted">리소스를 선택하세요.</p>
      </aside>
    );
  }

  return (
    <aside className="detail">
      <dl>
        <dt>이름</dt>
        <dd>{r.name}</dd>

        <dt>위치</dt>
        <dd>{breadcrumb || '최상위'}</dd>

        <dt>종류</dt>
        <dd>{r.type}</dd>

        <dt>상태</dt>
        <dd>
          <span className="dot" style={{ background: STATUS_COLOR[r.status] }} /> {r.status}
        </dd>

        <dt>마지막 갱신</dt>
        <dd>{formatDateTime(r.updatedAt)}</dd>

        {/* 0도 유효한 값이라 `r.cpu &&` 대신 `!== null` 로 확인 (0 && → 화면에 "0"이 그려짐) */}
        {r.phase !== null && (
          <>
            <dt>Phase</dt>
            <dd>{r.phase}</dd>
          </>
        )}
        {r.cpu !== null && (
          <>
            <dt>CPU</dt>
            <dd>{r.cpu}%</dd>
          </>
        )}
        {r.memory !== null && (
          <>
            <dt>메모리</dt>
            <dd>{r.memory}%</dd>
          </>
        )}
        {r.restarts !== null && (
          <>
            <dt>재시작 횟수</dt>
            <dd>{r.restarts}</dd>
          </>
        )}
      </dl>
    </aside>
  );
};

export default DetailPanel;
