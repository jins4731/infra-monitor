package com.opensource.backend;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.opensource.backend.resource.ResourceMapper;

/**
 * 실제 Kubernetes 환경이 없으므로, 3초마다 무작위 Pod 몇 개의 상태를 바꿔서
 * "리소스 상태가 계속 변하는 상황"을 흉내 낸다. (폴링 동작 확인용)
 */
@Component
public class StatusSimulator {
  private static final int CHANGES_PER_TICK = 20; // 한 번에 바꿀 Pod 수

  private final ResourceMapper resourceMapper;
  private long maxId = 0;

  public StatusSimulator(ResourceMapper resourceMapper) {
    this.resourceMapper = resourceMapper;
  }

  @Scheduled(fixedDelay = 3000, initialDelay = 5000) // 서버 시작 5초 뒤부터, 3초마다
  public void tick() {
    if (maxId == 0) {
      maxId = resourceMapper.findMaxId();
    }

    ThreadLocalRandom random = ThreadLocalRandom.current();
    LocalDateTime now = LocalDateTime.now();

    for (int i = 0; i < CHANGES_PER_TICK; i++) {
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
  }
}
