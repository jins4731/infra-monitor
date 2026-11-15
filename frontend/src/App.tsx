import { useEffect, useState } from 'react';
import './App.css'
import { fetchClusters } from './api';
import type { Resource } from './types';

function App() {
  const [nodes, setNodes] = useState<Map<number, Resource>>(new Map());
  const [rootIds, setRootIds] = useState<number[]>([]);

  useEffect(() => {
    fetchClusters().then((list) => {
      const nodeMap = new Map<number, Resource>();
      const ids: number[] = [];
      list.forEach((node) => {
        ids.push(node.id);
        nodeMap.set(node.id, node);
      });
      setNodes(nodeMap);
      setRootIds(ids);
    });  
  }, []);


  return (
    <div className="App">
      <h1>Infra Monitor</h1>
      {
        rootIds.map((id) => {
          const node = nodes.get(id);
          return (
            <div key={id}>
              <h2>{node?.name}</h2>
            </div>
          );
        })
      }
    </div>
  )  
}

export default App
