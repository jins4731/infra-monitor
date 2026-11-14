package com.opensource.backend.resource;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ResourceMapper {
  List<Resource> findClusters();

  List<Resource> findChildren(@Param("parentId") Long parentId, @Param("status") String status);

  Resource findById(Long id);

  List<Resource> search(String q);
}
