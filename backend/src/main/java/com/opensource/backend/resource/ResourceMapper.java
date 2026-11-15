package com.opensource.backend.resource;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ResourceMapper {
  List<Resource> findClusters();

  List<Resource> findChildren(@Param("parentId") Long parentId, @Param("status") String status);

  Resource findById(Long id);

  List<Resource> search(String q);

  // 폴링: since 이후 바뀐 리소스
  List<Resource> findChangedSince(@Param("since") LocalDateTime since);

  // 시뮬레이터용
  long findMaxId();

  List<Long> findIdsByType(@Param("type") String type);

  void updateMetrics(@Param("id") long id, @Param("cpu") int cpu, @Param("memory") int memory,
                     @Param("now") LocalDateTime now);

  void updatePodStatus(@Param("id") long id, @Param("status") String status, @Param("phase") String phase,
                       @Param("restarts") int restarts, @Param("cpu") int cpu, @Param("now") LocalDateTime now);
}
