import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { PortfolioRepositories } from './components/PortfolioRepositories';
import { PortfolioProjects } from './components/PortfolioProjects';
import { PortfolioProjectDetail } from './components/PortfolioProjectDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
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
