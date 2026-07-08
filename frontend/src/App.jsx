import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<h1 style={{textAlign: 'center', marginTop: '50px'}}>Kanban Board (Coming Soon!)</h1>} />
      </Routes>
    </Router>
  );
}

export default App;