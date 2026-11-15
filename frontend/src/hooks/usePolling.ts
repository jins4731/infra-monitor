import { useEffect, useState } from 'react';
import { fetchChanges } from '../api';
import { POLLING_INTERVAL_MS } from '../constants';
import { resourceChangeObserver } from '../observer';

/**
 * 주기적 폴링: 바뀐 리소스만 받아서 구독자에게 알린다.
 * - since(이전 응답의 서버 시간) 이후 바뀐 것만 요청 → 전체를 다시 받지 않는다
 * - setInterval 대신 setTimeout 연쇄: 응답이 늦어도 요청이 겹치지 않는다
 * - 브라우저 탭이 숨겨져 있으면 요청하지 않는다
 * @return {Date | null} 마지막으로 성공한 갱신 시각 (화면 표시용)
 */
const usePolling = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let since: string | null = null;
    let timer: number | undefined;
    let stopped = false;

    const poll = async () => {
      if (!document.hidden) {
        try {
          const changes = await fetchChanges(since);
          since = changes.serverTime;
          if (changes.items.length > 0) {
            resourceChangeObserver.notify(changes.items);
          }
          setLastSync(new Date());
        } catch {
          // 실패하면 같은 since 로 다음 주기에 다시 시도
        }
      }
      if (!stopped) {
        timer = window.setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  return lastSync;
};

export default usePolling;
