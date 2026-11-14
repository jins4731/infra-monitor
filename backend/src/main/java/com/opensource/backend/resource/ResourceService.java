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
}
