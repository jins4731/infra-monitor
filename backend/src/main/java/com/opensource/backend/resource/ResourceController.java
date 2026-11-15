package com.opensource.backend.resource;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController // JSON 반환
@RequestMapping("/api") // 공통 URL
public class ResourceController {
  private final ResourceService resourceService;

  public ResourceController(ResourceService resourceService) {
    this.resourceService = resourceService;
  }

  // 최초 화면: Cluster 목록
  @GetMapping("/clusters")
  public List<Resource> getClusters() {
    return resourceService.findClusters();
  }

  // 펼치기: 하위 리소스 목록 (?status=ERROR 로 필터)
  @GetMapping("/resources/{id}/children")
  public List<Resource> getChildren(@PathVariable Long id,
                                    @RequestParam(required = false) String status) {
    return resourceService.findChildren(id, status);
  }

  // 상세 조회 (없는 id면 404)
  @GetMapping("/resources/{id}")
  public ResponseEntity<Resource> getResource(@PathVariable Long id) {
    Resource resource = resourceService.findById(id);
    return resource == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(resource);
  }

  // 검색: 이름 앞부분 일치, 최대 50건
  @GetMapping("/search")
  public List<Resource> search(@RequestParam String q) {
    return resourceService.search(q);
  }

  // 폴링: since 이후 바뀐 리소스 (예: /api/changes?since=2026-11-15T14:00:00)
  @GetMapping("/changes")
  public ResourceService.Changes getChanges(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
    return resourceService.findChanges(since);
  }
}
