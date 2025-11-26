import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Your page components
import Home from "@/pages/Home";
// You might need to adjust the path for Portfolio
import { Portfolio } from "./components/Portfolio"; 
import NotFound from "@/pages/not-found"; 

// --- Mock Components (Replace these with your actual page components) ---
// Since the original file didn't include these, we use Home for simplicity.
const AboutPage = () => <div className="p-8 text-center text-xl">About Page Content</div>;
const ContactPage = () => <div className="p-8 text-center text-xl">Contact Page Content</div>;


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        
        {/* We use BrowserRouter as the root container */}
        <BrowserRouter>
          <Routes>
            {/* Standard Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* ======================================================= */}
            {/* 👇 PORTFOLIO ROUTES ADDED */}
            {/* ======================================================= */}
            
            {/* 1. Base Portfolio View (e.g., /portfolio) */}
            <Route path="/portfolio" element={<Portfolio />} />
            
            {/* 2. Repository Detail View (e.g., /portfolio/repo-id-123) */}
            {/* The Portfolio component will now use useParams() to read the repoId */}
            <Route path="/portfolio/:repoId" element={<Portfolio />} />
            
            {/* 3. Project Detail View (e.g., /portfolio/repo-id-123/projects/proj-id-456) */}
            {/* The Portfolio component will use useParams() to read repoId and projectId */}
            <Route path="/portfolio/:repoId/projects/:projectId" element={<Portfolio />} />
            
            {/* Catch-all route for 404 - MUST be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
