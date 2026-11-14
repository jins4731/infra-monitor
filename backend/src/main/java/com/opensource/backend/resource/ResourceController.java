package com.opensource.backend.resource;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;

@RestController // JSON 반환
@RequestMapping ("/api") // 공통 URL
public class ResourceController {
  private final ResourceService resourceService;

  public ResourceController(ResourceService resourceService) {
    this.resourceService = resourceService;
  }

  @GetMapping("/clusters")
  public List<Resource> getClusters() {
    return resourceService.findClusters();
  }
  
}
