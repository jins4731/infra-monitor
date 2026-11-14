package com.opensource.backend.resource;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper 
public interface ResourceMapper {
  List<Resource> findClusters();
}
