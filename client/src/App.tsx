import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PortfolioRepositories } from './components/PortfolioRepositories';
import { PortfolioProjects } from './components/PortfolioProjects';
import { PortfolioProjectDetail } from './components/PortfolioProjectDetail';
// Import your other components
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* NEW: Separate portfolio routes */}
        <Route path="/portfolio" element={<PortfolioRepositories />} />
        <Route path="/portfolio/:repoId" element={<PortfolioProjects />} />
        <Route path="/portfolio/:repoId/project/:projectId" element={<PortfolioProjectDetail />} />
        
        {/* REMOVE or COMMENT OUT the old single portfolio route */}
        {/* <Route path="/portfolio" element={<Portfolio />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
