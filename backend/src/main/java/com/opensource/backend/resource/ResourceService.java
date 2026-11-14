package com.opensource.backend.resource;

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
}
