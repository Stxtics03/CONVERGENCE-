import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Client from "./pages/client.tsx";
import Admin from "./pages/admin.tsx";

export default function App() {
  return (
    <Router>
      <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
        <Link to="/">Client</Link>
        <span style={{ margin: "0 10px" }}>|</span>
        <Link to="/admin">Admin</Link>
      </div>

      <Routes>
        <Route path="/" element={<Client />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
