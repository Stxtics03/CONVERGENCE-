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