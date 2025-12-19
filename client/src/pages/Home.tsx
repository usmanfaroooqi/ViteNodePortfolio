import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail, Loader2 } from "lucide-react";

interface Repository {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Query the "repositories" collection from Firebase
        const q = query(collection(db, "repositories"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Repository));

        setRepositories(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="min-h-[60vh] flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto pt-20">
        <span className="text-primary font-medium tracking-wider mb-4">PORTFOLIO</span>
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
          Creating digital <br/>
          <span className="text-muted-foreground">experiences that matter.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          I'm a passionate developer and designer focused on building accessible, 
          human-centered products.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setLocation("/admin")} variant="outline" className="border-white/10">
            Admin Login
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Github className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><Linkedin className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><Mail className="w-5 h-5" /></Button>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="px-4 md:px-12 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-bold">Selected Work</h2>
        </div>

        {repositories.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
            <p className="text-muted-foreground">No projects found. Login to Admin to add some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {repositories.map((repo) => (
              <div 
                key={repo.id}
                onClick={() => setLocation(/repo/${repo.id})}
                className="group cursor-pointer bg-background/50 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
              >
                {/* Image Container */}
                <div className="aspect-video overflow-hidden bg-muted">
                  <img 
                    src={repo.coverImage} 
                    alt={repo.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {repo.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {repo.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {repo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
