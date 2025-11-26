import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Settings, Folder, Image as ImageIcon, ArrowLeft, Plus, Minus, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

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

export function PortfolioProjects() {
  const { toast } = useToast();
  const { repoId } = useParams();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectImageUrls, setProjectImageUrls] = useState<string[]>([""]);
  
  const [newProject, setNewProject] = useState<{
    title: string;
    description: string;
  }>({
    title: "", description: ""
  });

  const handleLogin = () => {
    const storedPassword = localStorage.getItem("adminPassword") || "usman2006";
    if (adminPassword === storedPassword) { 
        setIsAuthenticated(true);
        setIsEditMode(true);
        setAuthDialogOpen(false);
        toast({ title: "Success", description: "Admin mode enabled." });
    } else {
        toast({ title: "Error", description: "Invalid password", variant: "destructive" });
    }
  };

  // Load repository and projects
  useEffect(() => {
    if (!repoId) return;

    // Load repository
    const repoUnsubscribe = onSnapshot(doc(db, "repositories", repoId), 
      (doc) => {
        if (doc.exists()) {
          setRepository({ id: doc.id, ...doc.data() } as Repository);
        }
        setLoading(false);
      }
    );

    // Load projects
    const projectsUnsubscribe = onSnapshot(
      query(collection(db, "repositories", repoId, "projects"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const projs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        setProjects(projs);
      }
    );

    return () => {
      repoUnsubscribe();
      projectsUnsubscribe();
    };
  }, [repoId]);

  const handleAddProject = async () => {
    const validImageUrls = projectImageUrls.filter(url => url.trim() !== "");
    
    if (!newProject.title || validImageUrls.length === 0 || !repoId) {
      toast({ title: "Error", description: "Title and at least one image URL are required.", variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, "repositories", repoId, "projects"), {
        title: newProject.title,
        description: newProject.description || "",
        images: validImageUrls,
        createdAt: serverTimestamp()
      });

      setNewProject({ title: "", description: "" });
      setProjectImageUrls([""]);
      setNewProjectOpen(false);
      toast({ title: "Success", description: "Project added to repository." });
    } catch (error: any) {
      console.error("Error adding project: ", error);
      toast({ title: "Error", description: `Failed to add project: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!repoId) return;
    if (confirm("Delete this project?")) {
      try {
        await deleteDoc(doc(db, "repositories", repoId, "projects", projectId));
        toast({ title: "Deleted", description: "Project removed." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
      }
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/portfolio/${repoId}/project/${project.id}`);
  };

  const addImageUrlField = () => {
    if (projectImageUrls.length < 7) {
      setProjectImageUrls([...projectImageUrls, ""]);
    }
  };

  const removeImageUrlField = (index: number) => {
    if (projectImageUrls.length > 1) {
      const newUrls = projectImageUrls.filter((_, i) => i !== index);
      setProjectImageUrls(newUrls);
    }
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...projectImageUrls];
    newUrls[index] = value;
    setProjectImageUrls(newUrls);
  };

  const resetNewProjectForm = () => {
    setNewProject({ title: "", description: "" });
    setProjectImageUrls([""]);
  };

  if (loading) {
    return (
      <Section className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Section>
    );
  }

  if (!repository) {
    return (
      <Section className="text-center py-20">
        <h2 className="text-2xl font-display font-bold mb-4">Repository not found</h2>
        <Button onClick={() => navigate('/portfolio')}>Back to Repositories</Button>
      </Section>
    );
  }

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20">
      {/* Header & Controls */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/portfolio')}
            className="pl-0 hover:bg-transparent hover:text-primary mb-2 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to Collections
          </Button>
        </div>
        <div className="flex gap-2">
            <Button 
            variant="ghost" 
            size="sm" 
            className={cn("text-xs text-muted-foreground gap-2", isEditMode && "text-primary bg-primary/10")}
            onClick={() => {
                if (isEditMode) {
                    setIsEditMode(false);
                    setIsAuthenticated(false);
                } else {
                    setAuthDialogOpen(true);
                }
            }}
            >
            <Settings className="w-3 h-3" /> {isEditMode ? "Exit Admin" : "Admin Login"}
            </Button>
        </div>

        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Admin Login</DialogTitle>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Password</Label>
                        <Input 
                            type="password" 
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleLogin}>Login</Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* Repository Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Folder className="w-4 h-4" />
          {repository.category}
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          {repository.title}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {repository.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Add New Project Card */}
        {isEditMode && (
          <Dialog open={newProjectOpen} onOpenChange={(open) => {
            setNewProjectOpen(open);
            if (!open) resetNewProjectForm();
          }}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-primary transition-colors bg-primary/5 hover:bg-primary/10">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="font-medium">Add New Project</span>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogTitle>Add Project to {repository.title}</DialogTitle>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Project Name *</Label>
                  <Input 
                    value={newProject.title} 
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Describe your project..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      Project Images ({projectImageUrls.filter(url => url.trim() !== "").length}/7) *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addImageUrlField}
                      disabled={projectImageUrls.length >= 7}
                      className="h-8 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add URL
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {projectImageUrls.map((url, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder={`Image URL #${index + 1}`}
                            value={url}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        {projectImageUrls.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeImageUrlField(index)}
                            className="shrink-0 h-10 w-10"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Add up to 7 image URLs. Each URL must be a direct link to an image file.
                  </p>

                  {projectImageUrls.some(url => url.trim() !== "") && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">Image Previews</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {projectImageUrls.filter(url => url.trim() !== "").map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewProjectOpen(false);
                    resetNewProjectForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProject} 
                  disabled={!newProject.title || projectImageUrls.filter(url => url.trim() !== "").length === 0}
                >
                  Add Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {projects.map((project, index) => (
          <FadeIn key={project.id} delay={index * 0.1} className="relative group">
            {isEditMode && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <div 
              onClick={() => handleProjectClick(project)}
              className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3] transition-all duration-500 group-hover:scale-[1.02]"
            >
              <img 
                src={project.images[0]} 
                alt={project.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                <h3 className="text-white font-display font-bold text-xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{project.title}</h3>
                <p className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100 line-clamp-2">
                  {project.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}