import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
// 👇 Import the Portfolio Component
import { Portfolio } from "./components/Portfolio"; 

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* ======================================================= */}
      {/* 👇 PORTFOLIO ROUTES ADDED USING WOUTER SYNTAX */}
      {/* ======================================================= */}
      
      {/* Base Portfolio View (Repositories) */}
      <Route path="/portfolio" component={Portfolio} /> 
      
      {/* Repository Detail View (Projects) */}
      {/* Wouter passes URL parameters in the second argument of render/component props */}
      <Route path="/portfolio/:repoId">
        {/* We use a function as children to pass the params explicitly */}
        {params => <Portfolio repoId={params.repoId} />}
      </Route>
      
      {/* Project Detail View (Optional, but included for completeness) */}
      <Route path="/portfolio/:repoId/projects/:projectId">
        {params => <Portfolio repoId={params.repoId} projectId={params.projectId} />}
      </Route>

      {/* Default/404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
