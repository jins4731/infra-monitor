package com.opensource.backend;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component 
public class MockDataGenerator implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    public MockDataGenerator(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final String INSERT_SQL =
        "INSERT INTO resource (id, type, name, status, phase, parent_id, path, updated_at, cpu, memory, restarts) "
      + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    private final List<Object[]> buffer = new ArrayList<>();
    private long nextId = 1;

    @Override
    public void run(String... args) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM resource", Integer.class);
        if (count != null && count > 0) return;   // 이미 있으면 건너뜀

        // TODO: 4중 for문으로 Cluster → Node → Namespace → Pod 생성
        //  - id는 nextId++ 로
        //  - path는 부모 path + id + "/"   (예: "/1/" → "/1/2/")
        //  - 한 줄 만들 때마다 add(...) 호출

        for (int c=1; c<=20; c++) {
          long clusterId = nextId++;
          String clusterPath = "/" + clusterId + "/";
          String clusterName = "cluster-" + c;
          add(clusterId, "CLUSTER", clusterName, "HEALTHY", null, null,
          clusterPath, new Timestamp(System.currentTimeMillis()), null, null, null);
          for (int n=1; n<=10; n++) {
            long nodeId = nextId++;
            String nodePath = clusterPath + nodeId + "/";
            String nodeName = clusterName + "-node-" + n;
            add(nodeId, "NODE", nodeName, "HEALTHY", null, clusterId,
            nodePath,
             new Timestamp(System.currentTimeMillis()), (int)(Math.random() * 100), (int)(Math.random() * 100), null);
            for (int ns=1; ns<=10; ns++) {
              long namespaceId = nextId++;
              String namespacePath = nodePath + namespaceId + "/";
              String namespaceName = "ns-" + ns;
              add(namespaceId, "NAMESPACE", namespaceName, "HEALTHY", null, nodeId,
                namespacePath, new Timestamp(System.currentTimeMillis()), null, null, null);
              for (int p=1; p<=50; p++) {
                long podId = nextId++;
                String podPath = namespacePath + podId + "/";
                String podName = nodeName + "-" + namespaceName + "-pod-" + p;
                 // ★ 상태 정하기
                double r = Math.random();
                String status, phase;
                int restarts;
                if (r < 0.03) {                 // 3%
                    status = "ERROR";
                    phase = "CrashLoopBackOff";
                    restarts = 5 + (int) (Math.random() * 26);   // 5~30
                } else if (r < 0.10) {          // 7% (0.03 ~ 0.10)
                    status = "WARNING";
                    phase = "Pending";
                    restarts = (int) (Math.random() * 3);        // 0~2
                } else {                        // 90%
                    status = "HEALTHY";
                    phase = "Running";
                    restarts = 0;
                }

                add(podId, "POD", podName, status, phase, namespaceId,           // ★ 변수 사용
                    podPath, new Timestamp(System.currentTimeMillis()),
                    (int) (Math.random() * 100), (int) (Math.random() * 100), restarts);
              }
            }
          }
        }

        flush();
        System.out.println("Mock data: " + (nextId - 1) + " rows");
    }

    private void add(Object... row) {
        buffer.add(row);
        if (buffer.size() >= 1000) flush();
    }

    private void flush() {
        jdbc.batchUpdate(INSERT_SQL, buffer);
        buffer.clear();
    } 
}
