package com.opensource.backend;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.opensource.backend.resource.ResourceMapper;

/**
 * 실제 Kubernetes 환경이 없으므로, 3초마다 일부 리소스 값을 바꿔서
 * "리소스 상태가 계속 변하는 상황"을 흉내 낸다. (폴링 동작 확인용)
 * - Pod: 무작위 20개의 상태(정상/경고/오류)와 CPU
 * - Node: 무작위 20개의 CPU/메모리 사용률 (Node 는 200개뿐이라 화면에서 변화가 잘 보인다)
 */
@Component
public class StatusSimulator {
  private static final int POD_CHANGES_PER_TICK = 20;
  private static final int NODE_CHANGES_PER_TICK = 20;

  private final ResourceMapper resourceMapper;
  private long maxId = 0;
  private List<Long> nodeIds = List.of();

  public StatusSimulator(ResourceMapper resourceMapper) {
    this.resourceMapper = resourceMapper;
  }

  @Scheduled(fixedDelay = 3000, initialDelay = 5000) // 서버 시작 5초 뒤부터, 3초마다
  public void tick() {
    if (maxId == 0) {
      maxId = resourceMapper.findMaxId();
      nodeIds = resourceMapper.findIdsByType("NODE");
    }

    ThreadLocalRandom random = ThreadLocalRandom.current();
    LocalDateTime now = LocalDateTime.now();

    // Pod 상태 변경
    for (int i = 0; i < POD_CHANGES_PER_TICK; i++) {
      long id = 1 + random.nextLong(maxId); // Pod 가 아닌 id 가 뽑히면 UPDATE 조건(type = 'POD')에서 걸러진다
      double r = random.nextDouble();

      if (r < 0.03) {
        resourceMapper.updatePodStatus(id, "ERROR", "CrashLoopBackOff", 5 + random.nextInt(26), random.nextInt(100), now);
      } else if (r < 0.10) {
        resourceMapper.updatePodStatus(id, "WARNING", "Pending", random.nextInt(3), random.nextInt(100), now);
      } else {
        resourceMapper.updatePodStatus(id, "HEALTHY", "Running", 0, random.nextInt(100), now);
      }
    }

    // Node 사용률 변경
    for (int i = 0; i < NODE_CHANGES_PER_TICK && !nodeIds.isEmpty(); i++) {
      long id = nodeIds.get(random.nextInt(nodeIds.size()));
      resourceMapper.updateMetrics(id, random.nextInt(100), random.nextInt(100), now);
    }
  }
}
