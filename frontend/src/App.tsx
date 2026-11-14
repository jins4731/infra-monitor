import { useEffect, useState } from 'react';
import './App.css'
import { fetchClusters } from './api';
import type { Resource } from './types';

function App() {
  const [data, setData] = useState<Resource[]>([]);

  useEffect(() => {
    fetchClusters().then(data => {
      console.log(data);
      setData(data);
    });
  }, []);

  return (
    <div className="App">
      <h1>Infra Monitor</h1>
      <ul>
        {data.map(resource => (
          <li key={resource.id}>
            {resource.name} - {resource.type} - {resource.status}
          </li>
        ))}
      </ul>
    </div>
  )  
}

export default App
