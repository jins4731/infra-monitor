# Infra Monitor

Kubernetes 리소스(Cluster → Node → Namespace → Pod, Pod 10만 건)를 계층 트리로 탐색하고, 상태 변화를 주기적으로 반영하는 모니터링 서비스입니다.

## 1. 실행 방법

**요구 사항:** Java 21, Node.js 20 이상

```bash
# 1) Backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
# 최초 실행 시 Mock 데이터 102,220건 생성 → 로그: "Mock data: 102220 rows"

# 2) Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

- DB는 H2 파일 모드(`backend/data/`)라 별도 설치가 필요 없습니다.
- 데이터를 새로 만들려면 서버를 끄고 `backend/data` 폴더를 지운 뒤 다시 실행합니다.
- 성능 측정은 프로덕션 빌드로 합니다: `npm run build && npm run preview` (http://localhost:4173)

## 2. 사용한 기술 및 선택 이유

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| Backend | Spring Boot 4.0, Java 21 | 실무에서 사용한 Controller → Service → Mapper 구조를 그대로 적용했습니다. MyBatis 스타터가 지원하는 최신 버전(4.0.x)을 골랐습니다. |
| SQL 매핑 | MyBatis | 계층 조회와 인덱스를 고려한 쿼리를 직접 작성해야 하는 과제라 SQL을 직접 통제할 수 있는 MyBatis를 선택했습니다. |
| DB | H2 (파일 모드) | 설치 없이 실행되면서도, 데이터를 디스크에 두고 인덱스로 조회하는 구조를 만들 수 있습니다. 전체를 메모리에 올려 순회하지 않습니다. |
| Frontend | React 19, TypeScript, Vite | 서버 응답 구조를 타입으로 정의해 필드 오타나 null 처리 실수를 컴파일 단계에서 잡았습니다. |
| 가상 스크롤 | @tanstack/react-virtual | 스타일이 없는(headless) 라이브러리라 트리 줄을 원하는 형태로 직접 그릴 수 있습니다. |

## 3. 프로젝트 구조

```
backend/src/main/
├─ java/com/opensource/backend/
│  ├─ BackendApplication.java      # @EnableScheduling
│  ├─ MockDataGenerator.java       # 시작 시 Mock 데이터 생성 (1,000건씩 배치 INSERT)
│  ├─ StatusSimulator.java         # 3초마다 Pod 상태·Node 사용률 변경 (폴링 확인용)
│  └─ resource/
│     ├─ ResourceController.java   # REST API
│     ├─ ResourceService.java
│     ├─ ResourceMapper.java       # MyBatis 인터페이스
│     └─ Resource.java             # 테이블 1행
└─ resources/
   ├─ schema.sql                   # 테이블 + 인덱스
   ├─ mapper/ResourceMapper.xml    # SQL
   └─ application.yml

frontend/src/
├─ App.tsx
├─ containers/                     # Container: 상태, 서버 요청, 이벤트 처리
│  ├─ MonitorContainer.tsx
│  └─ SearchContainer.tsx          # 검색어, 디바운스, 요청 취소
├─ hooks/
│  ├─ useResourceTree.ts           # 트리 상태(퍼사드): 펼치기, 검색 위치 펼치기, 필터, 평탄화
│  └─ usePolling.ts                # 변경분 폴링 → 옵저버로 알림
├─ components/                     # Presentational: props 로 받은 것만 그림
│  ├─ TreeView.tsx                 # 가상 스크롤 박스
│  ├─ TreeRow.tsx                  # 트리 한 줄 (React.memo)
│  ├─ DetailPanel.tsx
│  ├─ SearchBox.tsx
│  └─ StatusFilter.tsx
├─ filters.ts                      # 상태 필터 (전략 패턴)
├─ observer.ts                     # 리소스 변경 알림 (옵저버 패턴)
├─ api.ts / types.ts / constants.ts / utils.ts
```

## 4. 구현한 기능

| 기능 | 내용 |
|---|---|
| 리소스 탐색 | Cluster → Node → Namespace → Pod 트리. **펼칠 때 하위를 요청**하고, 한 번 받은 하위는 캐시해서 다시 펼칠 때 요청하지 않습니다. |
| 전체 펼치기 | Cluster마다 하위 전체를 요청 1번으로 받아 102,220줄을 펼칩니다. (10만 건 스크롤 확인용) |
| 리소스 선택 | 선택하면 오른쪽에 이름, 위치(상위 경로), 종류, 상태, 마지막 갱신 시간, Phase, CPU/메모리, 재시작 횟수를 보여줍니다. |
| 검색 | 이름 앞부분 일치, 최대 50건. 결과를 고르면 **상위 경로를 모두 펼치고 해당 줄로 스크롤**하며, 상세에 위치를 표시합니다. |
| 필터 | 전체 / 정상 / 경고 / 오류. Pod를 상태로 거릅니다. 서버 요청 없이 화면에서 바로 반영됩니다. |
| 데이터 갱신 | 3초 주기 폴링으로 **바뀐 리소스만** 받아 해당 줄만 다시 그립니다. 바뀐 값은 1초간 강조됩니다. |

### 데이터 갱신 방식으로 주기적 폴링을 선택한 이유

- 모니터링 화면은 수 초의 지연이 허용되고, 변경분만 받으면 응답이 작습니다 (주기당 수십 건).
- 서버가 연결을 유지하지 않아(무상태) 구현과 장애 대응이 단순하고, 프록시·방화벽 환경에서도 안정적입니다.
- 실시간성이 더 필요해지면 같은 `since` 기반 변경분 조회를 SSE로 보내는 방식으로 확장할 수 있습니다.

## 5. 구현 과정에서 고려한 사항

| 고려한 점 | 적용한 방법 |
|---|---|
| 화면과 로직의 분리 | **Presentational & Container 패턴.** `components/`는 상태나 API 호출 없이 props만 그리고, `containers/`와 훅이 상태와 요청을 담당합니다. |
| 복잡한 트리 상태 감추기 | **커스텀 훅 + 퍼사드 패턴.** `useResourceTree` 안에 Map/Set 4개, 캐시, 평탄화를 감추고, Container는 `rows`, `toggle`, `reveal`만 사용합니다. |
| 불필요한 리렌더링 방지 | **메모이제이션.** `TreeRow`는 `React.memo`, 이벤트 함수는 `useCallback`으로 참조를 고정, 평탄화 결과는 `useMemo`로 캐시합니다. |
| 필터 조건 확장 | **전략 패턴.** 필터 조건을 `match` 함수로 캡슐화해 키로 고릅니다. 새 조건은 `filters.ts`에 한 줄 추가하면 됩니다. |
| 폴링과 화면의 결합 줄이기 | **옵저버 패턴.** 폴링은 변경분을 `notify`만 하고, 트리가 `subscribe`해서 반영합니다. 새 화면이 생겨도 구독만 추가하면 됩니다. |
| 상태 불변성 | Map/Set을 직접 고치지 않고 **복사본을 만들어 교체**합니다. 바뀐 것이 없으면 기존 객체를 그대로 돌려줘 리렌더링을 막습니다. |
| 중복 요청 방지 | 요청한 부모 id를 `useRef`에 기록해, 응답 전에 여러 번 눌러도 요청은 한 번만 갑니다. |
| 검색 요청 정리 | 0.3초 디바운스, 입력이 바뀌면 `AbortController`로 이전 요청을 취소합니다. |
| 폴링 요청 겹침 | `setInterval` 대신 `setTimeout` 연쇄로, 응답을 받은 뒤 다음 요청을 예약합니다. 탭이 숨겨지면 요청하지 않습니다. |

## 6. 설계 문서

### 6-1. 프론트엔드 렌더링 전략

**트리 평탄화 + 가상 스크롤**

가상 스크롤은 평평한 배열만 그릴 수 있으므로, 트리를 "지금 보여야 하는 줄"만 담은 배열(`rows`)로 폅니다.

```
상태 (useResourceTree)                    rows (평탄화 결과)
nodes:      Map<id, Resource>             [{ id: 1,    depth: 0 },   cluster-1   ▾
rootIds:    [1, 5112, ...]           →     { id: 2,    depth: 1 },     node-1    ▾
childrenOf: Map<부모 id, 자식 id[]>         { id: 3,    depth: 2 },       ns-1
expanded:   Set<id>                         { id: 5112, depth: 0 }]  cluster-2   ▸
```

- 펼쳐진 노드만 재귀로 따라 내려가며 `{ id, depth }`를 쌓습니다. `depth`는 들여쓰기에 씁니다.
- `childrenOf`에는 **id만** 저장하고 데이터는 `nodes` 한 곳에만 둡니다. 폴링으로 값이 바뀌면 `nodes`만 고치면 됩니다.
- 스크롤 박스 안에 `줄 수 × 30px` 높이의 빈 공간을 만들고, **보이는 줄 + 위아래 10줄만** DOM으로 그립니다. 각 줄은 `transform: translateY`로 위치를 잡습니다.
- 10만 2천 줄을 펼쳐도 실제 DOM은 30~40개입니다.

### 6-2. 계층 데이터 모델링

`resource` 테이블 하나에 4단계를 모두 저장합니다.

| 컬럼 | 용도 |
|---|---|
| `parent_id` | **인접 리스트(Adjacency List).** 펼치기 = `WHERE parent_id = ?` 한 번 |
| `path` (`/1/2/3/4/`) | **Materialized Path.** ① 검색 결과의 상위 경로를 행 하나만 읽고 알 수 있음 ② `LIKE '/5112/%'`로 하위 전체를 쿼리 1번에 조회 |
| `status` / `phase` | 필터용 3단계 상태(HEALTHY/WARNING/ERROR) / 화면 표시용 K8s 상태(Running, Pending, CrashLoopBackOff) |
| `updated_at` | 마지막 갱신 시간, 폴링 변경분 조회 기준 |
| `cpu`, `memory`, `restarts` | Node·Pod 사용률(%), Pod 재시작 횟수 |

- `parent_id`만 있으면 경로를 찾을 때 상위로 3번 조회해야 해서 `path`를 함께 둡니다. 이 과제에서 리소스는 다른 부모로 옮겨가지 않으므로 `path`를 갱신할 일이 없습니다.
- 4단계의 조회 방식(펼치기, 검색, 상세)이 같아서 테이블 하나로 API와 화면 코드를 공통으로 처리합니다.

### 6-3. 인덱스 및 쿼리 전략

| 인덱스 | 쿼리 | 비고 |
|---|---|---|
| `idx_parent_status (parent_id, status)` | 펼치기 `WHERE parent_id = ?` | 복합 인덱스의 앞 컬럼만으로도 사용됨 |
| `idx_name (name)` | 검색 `WHERE name LIKE 'abc%'` | **앞부분 일치**라 인덱스 사용 가능. `'%abc%'`는 전체 스캔이라 쓰지 않음 |
| `idx_path (path)` | 전체 펼치기 `WHERE path LIKE '/5112/%'` | 앞부분 일치, Cluster 하나의 하위 5,111건을 한 번에 |
| `idx_updated_at (updated_at)` | 폴링 `WHERE updated_at > ?` | 최근에 바뀐 범위만 읽음 |
| PK | 상세 `WHERE id = ?` | |

- Pod 이름에 상위 이름을 붙였습니다 (`cluster-3-node-7-ns-2-pod-15`). 앞부분 일치 검색만으로 원하는 범위를 좁힐 수 있고, 검색 결과에서 같은 이름이 겹치지 않습니다.
- 데이터 생성은 1,000건씩 묶은 **배치 INSERT**로, DB 왕복을 10만 번에서 100번으로 줄였습니다.

### 6-4. API 설계

| Method | URL | 설명 |
|---|---|---|
| GET | `/api/clusters` | 최상위 Cluster 목록 |
| GET | `/api/resources/{id}/children` | 하위 목록 (펼치기). `?status=`로 서버 필터도 가능 |
| GET | `/api/resources/{id}/descendants` | 하위 전체 (전체 펼치기) |
| GET | `/api/resources/{id}` | 상세. 없는 id면 404 |
| GET | `/api/search?q=` | 이름 앞부분 일치, 최대 50건 |
| GET | `/api/changes?since=` | `since` 이후 바뀐 리소스 + 다음 요청에 쓸 `serverTime` |

```jsonc
// GET /api/changes?since=2026-11-15T18:41:21.72
{
  "serverTime": "2026-11-15T18:41:24.75",   // 다음 요청의 since 로 그대로 보냄
  "items": [ { "id": 2, "type": "NODE", "name": "cluster-1-node-1", "cpu": 84, "updatedAt": "...", ... } ]
}
```

## 7. 성능 측정 결과

**측정 환경:** Chrome ( 버전 ), CPU 4x throttling, 캐시 비활성화, 프로덕션 빌드(`npm run preview`), PC:

| 항목 | 목표 | 결과 | 측정 방법 |
|---|---|---|---|
| 최초 진입 → Cluster 목록 | 500ms 이내 | | |
| 하위 펼치기 / 접기 | 100ms 이내 | | |
| 검색어 입력 → 결과 (디바운스 제외) | 300ms 이내 | | |
| 필터 적용 → 화면 반영 | 200ms 이내 | | |
| 10만 건 스크롤 FPS | 55fps 이상 | | |
| 폴링 갱신 시 깜빡임 / 전체 리렌더링 | 없음, 200ms 이내 | | |
| 탭 메모리 | 300MB 이하 (참고) | | |

## 8. 아쉬운 점 및 개선하고 싶은 부분

- **상위 리소스의 상태 집계:** 현재 Cluster/Node/Namespace의 상태는 하위 Pod 상태를 반영하지 않습니다. 그래서 상태 필터는 Pod에만 적용되고, 상위 리소스는 항상 표시됩니다. 상위 리소스에 하위 상태별 개수를 저장하고 Pod 상태가 바뀔 때 함께 갱신하면, "오류가 있는 경로만 보기"와 서버 측 필터링이 가능합니다.
- **필터 범위:** 필터는 화면에 받아온 Pod에만 적용됩니다. 펼치지 않은 영역은 펼칠 때 필터가 적용됩니다.
- **실시간성:** 3초 폴링입니다. 같은 변경분 조회 구조를 SSE로 보내면 지연을 줄일 수 있습니다.
- **폴링 누락 가능성:** 서버 시간 기준으로 `since`를 이어가므로, 변경이 기록된 뒤 커밋되기 전의 아주 짧은 순간에 조회되면 그 변경을 놓칠 수 있습니다. 조회 구간을 1초 정도 겹치고 `updatedAt` 비교로 중복을 무시하면 보완할 수 있습니다.
- **검색:** 앞부분 일치만 지원합니다. 중간 일치가 필요하면 전문 검색(n-gram) 인덱스가 필요합니다.
- **테스트:** API와 훅에 대한 자동화 테스트를 작성하지 못했습니다.

## 9. 추가 구현

| 기능 | 이유 |
|---|---|
| 전체 펼치기 / 전체 접기 | 10만 건 스크롤 성능을 실제로 확인하기 위해 필요했습니다. Materialized Path 덕분에 Cluster당 요청 1번으로 구현했습니다. |
| 상태 변화 시뮬레이터 | 실제 클러스터가 없어서, 폴링과 부분 갱신이 동작하는지 보려면 데이터가 실제로 바뀌어야 했습니다. |
| 변경 값 강조 | 폴링으로 값이 바뀐 줄이 1초간 노란색으로 표시돼, 무엇이 갱신됐는지 바로 보입니다. |

## 10. AI 도구 사용

Claude Code를 설계 검토와 구현 보조에 사용했습니다. 데이터 모델, Mock 데이터 생성, 트리 평탄화, 가상 스크롤은 직접 작성했고, 이후 기능(검색, 필터, 폴링)과 구조 개선은 AI로 구현한 뒤 동작을 확인하고 반영했습니다.
