import { useState, useEffect } from "react";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { CATEGORIES } from "@/data/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Settings, Folder, Image as ImageIcon, ArrowLeft, X, AlertTriangle, Loader2, Link as LinkIcon, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Firebase Imports
import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

// Types
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

export function Portfolio() {
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  
  // Password Management State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // FIXED: Proper view state management
  const [currentView, setCurrentView] = useState<"repositories" | "projects" | "project-detail">("repositories");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form States
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  
  // Manual Image URL State
  const [manualRepoImage, setManualRepoImage] = useState("");
  const [projectImageUrls, setProjectImageUrls] = useState<string[]>([""]);

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

  const handleChangePassword = () => {
      const storedPassword = localStorage.getItem("adminPassword") || "usman2006";
      if (currentPasswordInput !== storedPassword) {
          toast({ title: "Error", description: "Current password incorrect.", variant: "destructive" });
          return;
      }
      if (newPasswordInput.length < 4) {
          toast({ title: "Error", description: "New password must be at least 4 characters.", variant: "destructive" });
          return;
      }
      localStorage.setItem("adminPassword", newPasswordInput);
      toast({ title: "Success", description: "Password updated successfully." });
      setChangePasswordOpen(false);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
  };
  
  const [newRepo, setNewRepo] = useState<Partial<Repository>>({
    title: "", description: "", category: "Branding", coverImage: ""
  });
  
  const [newProject, setNewProject] = useState<{
    title: string;
    description: string;
  }>({
    title: "", description: ""
  });

  // --- Firebase: Listen to Repositories ---
  useEffect(() => {
    const q = query(collection(db, "repositories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const repos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Repository));
        setRepositories(repos);
        setLoading(false);
        setFirebaseError(null);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
        if (error.code === 'permission-denied') {
           setFirebaseError("Permission denied. Please enable Firestore Database in your Firebase Console and set rules to 'allow read, write: if true;' for testing.");
        } else if (error.code === 'unavailable') {
           console.log("Network unavailable, using cached data if available.");
        } else {
           setFirebaseError(`Database Error: ${error.message}`);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Firebase: Listen to Projects (when a repo is selected) ---
  useEffect(() => {
    if (!selectedRepo?.id) {
      setProjects([]);
      return;
    }

    const q = query(collection(db, "repositories", selectedRepo.id, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projs);
    });
    return () => unsubscribe();
  }, [selectedRepo?.id]);

  // --- Repository Management ---
  const handleAddRepository = async () => {
    const finalCoverImage = manualRepoImage;

    if (!newRepo.title || !finalCoverImage) {
      toast({ title: "Error", description: "Title and Cover Image URL are required.", variant: "destructive" });
      return;
    }
    
    try {
      await addDoc(collection(db, "repositories"), {
        title: newRepo.title,
        description: newRepo.description || "",
        category: newRepo.category || "Branding",
        coverImage: finalCoverImage,
        createdAt: serverTimestamp()
      });

      setNewRepo({ title: "", description: "", category: "Branding", coverImage: "" });
      setManualRepoImage("");
      setNewRepoOpen(false);
      toast({ title: "Success", description: "Repository created." });
    } catch (error: any) {
      console.error("Error adding repo: ", error);
      toast({ title: "Error", description: `Failed to create repository: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (confirm("Delete this repository? Note: Projects inside might not be deleted automatically.")) {
      try {
        await deleteDoc(doc(db, "repositories", id));
        toast({ title: "Deleted", description: "Repository removed." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete repository.", variant: "destructive" });
      }
    }
  };

  // --- Project Management ---
  const handleAddProject = async () => {
    // Filter out empty URLs and validate
    const validImageUrls = projectImageUrls.filter(url => url.trim() !== "");
    
    if (!newProject.title || validImageUrls.length === 0) {
      toast({ title: "Error", description: "Title and at least one image URL are required.", variant: "destructive" });
      return;
    }
    
    if (!selectedRepo?.id) return;

    try {
      await addDoc(collection(db, "repositories", selectedRepo.id, "projects"), {
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
    if (!selectedRepo?.id) return;
    if (confirm("Delete this project?")) {
      try {
        await deleteDoc(doc(db, "repositories", selectedRepo.id, "projects", projectId));
        toast({ title: "Deleted", description: "Project removed." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
      }
    }
  };

  // --- Image URL Management ---
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

  // FIXED: Navigation handlers that properly switch between views
  const handleRepositoryClick = (repo: Repository) => {
    setSelectedRepo(repo);
    setCurrentView("projects");
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setCurrentView("project-detail");
  };

  const handleBackToRepositories = () => {
    setCurrentView("repositories");
    setSelectedRepo(null);
    setSelectedProject(null);
  };

  const handleBackToProjects = () => {
    setCurrentView("projects");
    setSelectedProject(null);
  };

  // Reset new project form
  const resetNewProjectForm = () => {
    setNewProject({ title: "", description: "" });
    setProjectImageUrls([""]);
  };

  // --- Rendering Helpers ---
  const filteredRepos = activeCategory === "All" 
    ? repositories 
    : repositories.filter(r => r.category === activeCategory);

  // FIXED: Render completely different content based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case "repositories":
        return renderRepositoriesView();
      case "projects":
        return renderProjectsView();
      case "project-detail":
        return renderProjectDetailView();
      default:
        return renderRepositoriesView();
    }
  };

  const renderRepositoriesView = () => (
    <>
      <FadeIn>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Selected Work
          </h2>
          <p className="text-muted-foreground">
            A showcase of my recent projects and designs.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                activeCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Add New Repository Card */}
        {isEditMode && (
          <Dialog open={newRepoOpen} onOpenChange={setNewRepoOpen}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-primary transition-colors bg-primary/5 hover:bg-primary/10">
                <Folder className="w-12 h-12 mb-2" />
                <span className="font-medium">Add New Repository</span>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogTitle>Create New Repository</DialogTitle>
              <DialogDescription>Repositories are folders that contain multiple projects.</DialogDescription>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Repository Title *</Label>
                  <Input 
                    value={newRepo.title} 
                    onChange={(e) => setNewRepo({...newRepo, title: e.target.value})}
                    placeholder="e.g. Branding 2025" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newRepo.category}
                    onChange={(e) => setNewRepo({...newRepo, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Cover Image URL *</Label>
                  <div className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                          <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <Input 
                              placeholder="https://example.com/cover-image.jpg" 
                              value={manualRepoImage}
                              onChange={(e) => {
                                  setManualRepoImage(e.target.value);
                                  setNewRepo({...newRepo, coverImage: e.target.value}); 
                              }}
                          />
                      </div>
                      <p className="text-xs text-muted-foreground">
                          Must be a direct image link ending in .jpg, .png, or .webp
                      </p>
                  </div>

                  {/* PREVIEW */}
                  {manualRepoImage && (
                    <div className="mt-2">
                        <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
                        <div className="relative h-24 w-24 rounded-md overflow-hidden border border-border">
                            <img 
                                src={manualRepoImage} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    toast({ title: "Invalid Image", description: "The provided URL doesn't contain a valid image.", variant: "destructive" });
                                }}
                            />
                        </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newRepo.description}
                    onChange={(e) => setNewRepo({...newRepo, description: e.target.value})}
                    placeholder="Describe this repository..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setNewRepoOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddRepository} 
                  disabled={!newRepo.title || !manualRepoImage}
                >
                  Create Repository
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {filteredRepos.map((repo, index) => (
          <FadeIn key={repo.id} delay={index * 0.1} className="relative group">
            {isEditMode && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRepository(repo.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <div 
              onClick={() => handleRepositoryClick(repo)}
              className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3] transition-all duration-500 group-hover:scale-[1.02]"
            >
              <img 
                src={repo.coverImage} 
                alt={repo.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                <Folder className="text-white w-8 h-8 mb-2" />
                <h3 className="text-white font-display font-bold text-xl mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{repo.title}</h3>
                <p className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100 line-clamp-2">
                  {repo.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </>
  );

  const renderProjectsView = () => (
    <div className="space-y-8">
      {/* Repository Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Folder className="w-4 h-4" />
          {selectedRepo?.category}
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          {selectedRepo?.title}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {selectedRepo?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Add New Project Card */}
        {isEditMode && (
          <Dialog open={newProjectOpen} onOpenChange={(open) => {
            setNewProjectOpen(open);
            if (!open) {
              resetNewProjectForm();
            }
          }}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-primary transition-colors bg-primary/5 hover:bg-primary/10">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="font-medium">Add New Project</span>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogTitle>Add Project to {selectedRepo?.title}</DialogTitle>
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

                  {/* Image Previews */}
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
                            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-xs text-center p-2 hidden">
                              Invalid URL
                            </div>
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
    </div>
  );

  const renderProjectDetailView = () => (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="text-center mb-12">
        <Button 
          variant="ghost" 
          onClick={handleBackToProjects}
          className="pl-0 hover:bg-transparent hover:text-primary mb-4 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to {selectedRepo?.title}
        </Button>
        
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          {selectedProject?.title}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {selectedProject?.description}
        </p>
      </div>

      {/* Project Images - Professional Layout */}
      <div className={`grid gap-8 ${
        selectedProject?.images.length === 1 
          ? "grid-cols-1 max-w-4xl mx-auto" 
          : "grid-cols-1 md:grid-cols-2"
      }`}>
        {selectedProject?.images.map((image, index) => (
          <FadeIn key={index} delay={index * 0.1}>
            <div className={cn(
              "relative overflow-hidden rounded-2xl bg-muted border border-border",
              selectedProject.images.length === 1 
                ? "aspect-video max-w-6xl mx-auto" 
                : "aspect-[4/3]"
            )}>
              <img
                src={image}
                alt={`${selectedProject.title} - Image ${index + 1}`}
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
                    detail: { subject: `Inquiry about: ${selectedProject?.title}` } 
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
    </div>
  );

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20">
      {/* Header & Controls */}
      <div className="flex justify-between items-end mb-8">
        <div>
          {currentView !== "repositories" && (
            <Button 
              variant="ghost" 
              onClick={currentView === "projects" ? handleBackToRepositories : handleBackToProjects}
              className="pl-0 hover:bg-transparent hover:text-primary mb-2 group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              {currentView === "projects" ? "Back to Collections" : `Back to ${selectedRepo?.title}`}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
            {isEditMode && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground gap-2"
                    onClick={() => setChangePasswordOpen(true)}
                >
                    Change Password
                </Button>
            )}
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

        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Change Admin Password</DialogTitle>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Current Password</Label>
                        <Input 
                            type="password" 
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>New Password</Label>
                        <Input 
                            type="password" 
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleChangePassword}>Update Password</Button>
                </div>
            </DialogContent>
        </Dialog>

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

      {/* FIREBASE STATUS / ERRORS */}
      {firebaseError && (
         <FadeIn>
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8 text-sm text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Database Error</span>
            </div>
            <p className="opacity-80 max-w-lg">
              {firebaseError}
            </p>
          </div>
        </FadeIn>
      )}

      {/* PROTOTYPE WARNING */}
      {isEditMode && !firebaseError && (
        <FadeIn>
          <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg mb-8 text-sm text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 font-bold">
              <Folder className="w-4 h-4" />
              <span>Admin Mode Active</span>
            </div>
            <p className="opacity-80 max-w-lg">
              You can now manage repositories and projects.
            </p>
          </div>
        </FadeIn>
      )}

      {/* RENDER CURRENT VIEW */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        renderCurrentView()
      )}
    </Section>
  );
}
