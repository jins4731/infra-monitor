import { STATUS_COLOR } from '../constants';
import { FILTER_KEYS, STATUS_FILTERS, type FilterKey } from '../filters';

type Props = {
  value: FilterKey; // 지금 선택된 필터
  onChange: (key: FilterKey) => void;
};

/** Presentational: 상태 필터 버튼 묶음. 버튼 목록은 전략 객체(STATUS_FILTERS)에서 만든다 */
const StatusFilter = ({ value, onChange }: Props) => {
  return (
    <div className="filters">
      {FILTER_KEYS.map((key) => (
        <button
          key={key}
          className={value === key ? 'active' : ''}
          onClick={() => onChange(key)}
        >
          {key !== 'ALL' && <span className="dot" style={{ background: STATUS_COLOR[key] }} />}
          {STATUS_FILTERS[key].label}
        </button>
      ))}
    </div>
  );
};

export default StatusFilter;
