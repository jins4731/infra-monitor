package com.opensource.backend.resource;

import java.time.LocalDateTime;

public class Resource {
    private Long id;
    private String type;
    private String name;
    private String status;
    private String phase;
    private String path;
    private Long parentId;
    private LocalDateTime updatedAt;
    private Integer cpu;
    private Integer memory;
    private Integer restarts;

    public Long getId() {
      return id;
    }
    public void setId(Long id) {
      this.id = id;
    }
    public String getType() {
      return type;
    }
    public void setType(String type) {
      this.type = type;
    }
    public String getName() {
      return name;
    }
    public void setName(String name) {
      this.name = name;
    }
    public String getStatus() {
      return status;
    }
    public void setStatus(String status) {
      this.status = status;
    }
    public String getPhase() {
      return phase;
    }
    public void setPhase(String phase) {
      this.phase = phase;
    }
    public String getPath() {
      return path;
    }
    public void setPath(String path) {
      this.path = path;
    }
    public Long getParentId() {
      return parentId;
    }
    public void setParentId(Long parentId) {
      this.parentId = parentId;
    }
    public LocalDateTime getUpdatedAt() {
      return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
      this.updatedAt = updatedAt;
    }
    public Integer getCpu() {
      return cpu;
    }
    public void setCpu(Integer cpu) {
      this.cpu = cpu;
    }
    public Integer getMemory() {
      return memory;
    }
    public void setMemory(Integer memory) {
      this.memory = memory;
    }
    public Integer getRestarts() {
      return restarts;
    }
    public void setRestarts(Integer restarts) {
      this.restarts = restarts;
    }
}
