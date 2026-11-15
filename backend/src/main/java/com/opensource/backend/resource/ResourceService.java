package com.opensource.backend.resource;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ResourceService {
  private final ResourceMapper resourceMapper;

  public ResourceService(ResourceMapper resourceMapper) {
    this.resourceMapper = resourceMapper;
  }

  public List<Resource> findClusters() {
    return resourceMapper.findClusters();
  }

  public List<Resource> findChildren(Long parentId, String status) {
    return resourceMapper.findChildren(parentId, status);
  }

  public Resource findById(Long id) {
    return resourceMapper.findById(id);
  }

  public List<Resource> search(String q) {
    return resourceMapper.search(q);
  }

  /** 하위 전체: 대상의 path 로 시작하는 리소스를 한 번에 조회. 없는 id 면 null */
  public List<Resource> findDescendants(Long id) {
    Resource resource = resourceMapper.findById(id);
    if (resource == null) return null;
    return resourceMapper.findDescendants(resource.getPath());
  }

  /**
   * 폴링: since 이후 바뀐 리소스와, 다음 요청에 쓸 기준 시간을 함께 돌려준다.
   * 첫 요청(since 없음)은 기준 시간만 받아간다.
   */
  public Changes findChanges(LocalDateTime since) {
    LocalDateTime now = LocalDateTime.now();
    if (since == null) {
      return new Changes(now, List.of());
    }
    return new Changes(now, resourceMapper.findChangedSince(since));
  }

  /** 폴링 응답: serverTime 은 프론트가 다음 요청의 since 로 그대로 보낸다 */
  public record Changes(LocalDateTime serverTime, List<Resource> items) {}
}
