// In your App.js or App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Portfolio } from './components/Portfolio';
import { PortfolioRepositories } from './components/PortfolioRepositories';
import { PortfolioProjects } from './components/PortfolioProjects';
import { PortfolioProjectDetail } from './components/PortfolioProjectDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<Home />} />
        
        {/* ADD THESE PORTFOLIO ROUTES */}
        <Route path="/portfolio" element={<PortfolioRepositories />} />
        <Route path="/portfolio/:repoId" element={<PortfolioProjects />} />
        <Route path="/portfolio/:repoId/project/:projectId" element={<PortfolioProjectDetail />} />
      </Routes>
    </Router>
  );
}

export default App;