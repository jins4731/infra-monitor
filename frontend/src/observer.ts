import type { Resource } from './types';

/**
 * 옵저버 패턴
 * 상태 변화를 관찰하는 구독자(옵저버)들에게 자동으로 알림을 보낸다.
 * - subscribe: 구독하고, 구독 해제 함수를 돌려받는다 (useEffect cleanup 에서 호출)
 * - notify: 모든 구독자에게 데이터를 전달한다
 */
export const createObserver = <T>() => {
  let observers: ((data: T) => void)[] = [];

  return {
    subscribe: (callback: (data: T) => void) => {
      observers.push(callback);
      return () => {
        observers = observers.filter((observer) => observer !== callback);
      };
    },
    notify: (data: T) => {
      observers.forEach((observer) => observer(data));
    },
  };
};

/**
 * 리소스 변경 알림.
 * 폴링(usePolling)은 "누가 쓰는지" 모른 채 바뀐 리소스를 알리기만 하고,
 * 트리(useResourceTree) 같은 구독자가 각자 필요한 만큼 반영한다.
 */
export const resourceChangeObserver = createObserver<Resource[]>();
