import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  createdAt: any;
}

export interface Repository {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  createdAt: any;
}

export function PortfolioProjectDetail() {
  const { repoId, projectId } = useParams();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load repository and project
  useEffect(() => {
    if (!repoId || !projectId) return;

    // Load repository
    const repoUnsubscribe = onSnapshot(doc(db, "repositories", repoId), 
      (doc) => {
        if (doc.exists()) {
          setRepository({ id: doc.id, ...doc.data() } as Repository);
        }
      }
    );

    // Load project
    const projectUnsubscribe = onSnapshot(
      doc(db, "repositories", repoId, "projects", projectId),
      (doc) => {
        if (doc.exists()) {
          setProject({ id: doc.id, ...doc.data() } as Project);
        }
        setLoading(false);
      }
    );

    return () => {
      repoUnsubscribe();
      projectUnsubscribe();
    };
  }, [repoId, projectId]);

  if (loading) {
    return (
      <Section className="flex justify-center py-20">
        <div className="w-8 h-8 animate-spin text-primary">Loading...</div>
      </Section>
    );
  }

  if (!repository || !project) {
    return (
      <Section className="text-center py-20">
        <h2 className="text-2xl font-display font-bold mb-4">Project not found</h2>
        <Button onClick={() => navigate(`/portfolio/${repoId}`)}>Back to Projects</Button>
      </Section>
    );
  }

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/portfolio/${repoId}`)}
            className="pl-0 hover:bg-transparent hover:text-primary mb-2 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to {repository.title}
          </Button>
        </div>
      </div>

      {/* Project Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          {project.title}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {project.description}
        </p>
      </div>

      {/* Project Images - Professional Layout */}
      <div className={`grid gap-8 ${
        project.images.length === 1 
          ? "grid-cols-1 max-w-4xl mx-auto" 
          : "grid-cols-1 md:grid-cols-2"
      }`}>
        {project.images.map((image, index) => (
          <FadeIn key={index} delay={index * 0.1}>
            <div className={cn(
              "relative overflow-hidden rounded-2xl bg-muted border border-border",
              project.images.length === 1 
                ? "aspect-video max-w-6xl mx-auto" 
                : "aspect-[4/3]"
            )}>
              <img
                src={image}
                alt={`${project.title} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Project Info & CTA */}
      <div className="text-center border-t border-border pt-12 mt-12">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-display font-bold mb-4">
            Interested in this project?
          </h3>
          <p className="text-muted-foreground mb-8">
            Let's discuss how we can bring your vision to life.
          </p>
          <Button 
            size="lg" 
            onClick={() => {
              const contactSection = document.getElementById("contact");
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("prefillContact", { 
                    detail: { subject: `Inquiry about: ${project.title}` } 
                  }));
                }, 500);
              }
            }}
            className="px-8 py-6 text-lg font-semibold"
          >
            Start a Conversation
          </Button>
        </div>
      </div>
    </Section>
  );
}