import { useState, useEffect } from "react";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { CATEGORIES } from "@/data/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Settings, Folder, Image as ImageIcon, ArrowLeft, X, AlertTriangle, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import imageCompression from 'browser-image-compression';

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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Types ---
export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
}

export interface Repository {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
}

export function Portfolio() {
  const { toast } = useToast();
  
  // --- Data State ---
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // --- UI State ---
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentView, setCurrentView] = useState<"repositories" | "projects">("repositories");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- Admin/Auth State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // --- Form States ---
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Input States
  const [newRepo, setNewRepo] = useState<Partial<Repository>>({
    title: "", description: "", category: "Branding", coverImage: ""
  });
  const [manualRepoImage, setManualRepoImage] = useState("");

  const [newProject, setNewProject] = useState<{
    title: string;
    description: string;
    images: string[];
  }>({
    title: "", description: "", images: []
  });
  const [manualProjectImage, setManualProjectImage] = useState("");

  // --- Authentication Logic ---
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

  // --- Firebase: Listen to Repositories ---
  useEffect(() => {
    const q = query(collection(db, "repositories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const repos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repository));
        setRepositories(repos);
        setLoading(false);
      }, (error) => console.error("Firestore Error:", error)
    );
    return () => unsubscribe();
  }, []);

  // --- Firebase: Listen to Projects (Dynamic based on selectedRepoId) ---
  useEffect(() => {
    if (!selectedRepoId) {
      setProjects([]);
      return;
    }
    // Fetch projects inside the specific repository
    const q = query(collection(db, "repositories", selectedRepoId, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });
    return () => unsubscribe();
  }, [selectedRepoId]);


  // --- Helper: Image Upload ---
  const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        return await getDownloadURL(snapshot.ref);
    } catch (error: any) {
        console.error("Upload failed:", error);
        throw error;
    }
  };

  // --- Handlers: Repository ---
  const handleAddRepository = async () => {
    const finalCoverImage = manualRepoImage || newRepo.coverImage;
    if (!newRepo.title || !finalCoverImage) {
      toast({ title: "Error", description: "Title and Cover Image are required.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRepository = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the folder when deleting
    if (confirm("Delete this repository?")) {
      await deleteDoc(doc(db, "repositories", id));
    }
  };

  // --- Handlers: Projects ---
  const handleAddProject = async () => {
    if (!selectedRepoId) return;

    // Combine uploaded images + manual URL input if any
    let finalImages = [...newProject.images];
    if (manualProjectImage) finalImages.push(manualProjectImage);

    if (!newProject.title || finalImages.length === 0) {
      toast({ title: "Error", description: "Title and at least one image are required.", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      await addDoc(collection(db, "repositories", selectedRepoId, "projects"), {
        title: newProject.title,
        description: newProject.description || "",
        images: finalImages,
        createdAt: serverTimestamp()
      });
      setNewProject({ title: "", description: "", images: [] });
      setManualProjectImage("");
      setNewProjectOpen(false);
      toast({ title: "Success", description: "Project added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedRepoId) return;
    if (confirm("Delete this project?")) {
      await deleteDoc(doc(db, "repositories", selectedRepoId, "projects", projectId));
    }
  };

  // --- View Helper ---
  const activeRepo = repositories.find(r => r.id === selectedRepoId);
  const filteredRepos = activeCategory === "All" ? repositories : repositories.filter(r => r.category === activeCategory);

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20 min-h-[500px]">
      
      {/* --- Top Navigation Bar --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          {currentView === "projects" && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setCurrentView("repositories");
                setSelectedRepoId(null);
                setProjects([]);
              }} 
              className="pl-0 hover:bg-transparent hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Repositories
            </Button>
          )}
        </div>
        
        {/* Admin Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("text-xs text-muted-foreground gap-2", isEditMode && "text-primary bg-primary/10")}
          onClick={() => isEditMode ? setIsEditMode(false) : setAuthDialogOpen(true)}
        >
          <Settings className="w-3 h-3" /> {isEditMode ? "Exit Admin" : "Admin Login"}
        </Button>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
         <DialogContent><DialogTitle>Admin Login</DialogTitle>
            <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
            <Button onClick={handleLogin}>Login</Button>
         </DialogContent>
      </Dialog>

      <FadeIn>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {currentView === "repositories" ? "Selected Work" : activeRepo?.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {currentView === "repositories" 
              ? "Explore my projects organized by category." 
              : activeRepo?.description || "Projects in this collection."}
          </p>
        </div>
      </FadeIn>

      {/* ========================================================= */}
      {/* VIEW 1: REPOSITORIES (Folders)                            */}
      {/* ========================================================= */}
      {currentView === "repositories" && (
        <>
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeCategory === category ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* ADD REPOSITORY CARD (Admin Only) */}
            {isEditMode && (
              <Dialog open={newRepoOpen} onOpenChange={setNewRepoOpen}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Folder className="w-12 h-12 mb-2" />
                    <span className="font-medium">Create New Repo</span>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Create Repository</DialogTitle>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Repository Title" value={newRepo.title} onChange={e => setNewRepo({...newRepo, title: e.target.value})} />
                    <Input placeholder="Description" value={newRepo.description} onChange={e => setNewRepo({...newRepo, description: e.target.value})} />
                    <select className="w-full border p-2 rounded" value={newRepo.category} onChange={e => setNewRepo({...newRepo, category: e.target.value})}>
                        {CATEGORIES.filter(c => c!=='All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {/* Simplified Image Input for Repo */}
                    <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <Input type="file" onChange={async (e) => {
                            if(e.target.files?.[0]) {
                                setIsUploading(true);
                                const url = await uploadImageToStorage(e.target.files[0], `repos/${Date.now()}`);
                                setNewRepo({...newRepo, coverImage: url});
                                setIsUploading(false);
                            }
                        }} />
                        <Input placeholder="Or paste URL" value={manualRepoImage} onChange={e => setManualRepoImage(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleAddRepository} disabled={isUploading}>{isUploading ? "Uploading..." : "Create Repo"}</Button>
                </DialogContent>
              </Dialog>
            )}

            {/* REPOSITORY CARDS */}
            {filteredRepos.map((repo, index) => (
              <FadeIn key={repo.id} delay={index * 0.1} className="relative group">
                {isEditMode && (
                   <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-50 h-8 w-8" onClick={(e) => handleDeleteRepository(repo.id, e)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                )}
                <div 
                  onClick={() => {
                    setSelectedRepoId(repo.id);
                    setCurrentView("projects");
                  }}
                  className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3] group-hover:shadow-xl transition-all"
                >
                  <img src={repo.coverImage} alt={repo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-xl">{repo.title}</h3>
                    <p className="text-white/80 text-sm">{repo.category}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: PROJECTS (Inside a specific folder)               */}
      {/* ========================================================= */}
      {currentView === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
           
           {/* ADD PROJECT CARD (Admin Only) - HERE is the fix */}
           {isEditMode && (
              <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Plus className="w-12 h-12 mb-2" />
                    <span className="font-medium">Add Project</span>
                    <span className="text-xs text-muted-foreground mt-1">Upload up to 7 photos</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogTitle>Add New Project</DialogTitle>
                  <div className="space-y-4 py-4">
                    
                    {/* 1. Title & Desc */}
                    <div className="space-y-2">
                        <Label>Project Title</Label>
                        <Input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} placeholder="Details about the project..." />
                    </div>

                    {/* 2. Multiple Image Upload */}
                    <div className="border p-4 rounded-lg bg-muted/20">
                        <Label className="mb-2 block">Project Images (Select Multiple)</Label>
                        <Input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            disabled={isUploading}
                            onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;
                                
                                setIsUploading(true);
                                setUploadProgress(`Processing ${files.length} images...`);
                                
                                try {
                                    // Upload all selected files concurrently
                                    const uploadPromises = files.map(file => 
                                        uploadImageToStorage(file, `projects/${selectedRepoId}/${Date.now()}_${file.name}`)
                                    );
                                    const urls = await Promise.all(uploadPromises);
                                    
                                    setNewProject(prev => ({
                                        ...prev,
                                        images: [...prev.images, ...urls]
                                    }));
                                } catch (err) {
                                    console.error(err);
                                    toast({ title: "Upload Failed", variant: "destructive" });
                                } finally {
                                    setIsUploading(false);
                                    setUploadProgress("");
                                }
                            }} 
                        />
                        {isUploading && <div className="text-sm text-blue-500 mt-2 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> {uploadProgress}</div>}
                    </div>

                    {/* 3. Image Previews */}
                    {newProject.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {newProject.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square">
                                    <img src={img} className="w-full h-full object-cover rounded-md" />
                                    <button 
                                        onClick={() => setNewProject(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  <Button onClick={handleAddProject} disabled={isUploading} className="w-full">
                    {isUploading ? "Uploading..." : "Save Project"}
                  </Button>
                </DialogContent>
              </Dialog>
           )}

           {/* PROJECT CARDS */}
           {projects.map((project, index) => (
              <FadeIn key={project.id} delay={index * 0.1} className="relative group">
                {isEditMode && (
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-50 h-8 w-8" onClick={(e) => handleDeleteProject(project.id, e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div 
                  onClick={() => setSelectedProject(project)}
                  className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3]"
                >
                  <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <h3 className="text-white font-bold text-lg">{project.title}</h3>
                  </div>
                </div>
              </FadeIn>
           ))}
        </div>
      )}

      {/* --- Full Screen Project Modal --- */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedProject && (
             <div className="flex flex-col">
                <div className="relative h-64 md:h-96 w-full">
                    <img src={selectedProject.images[0]} className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><X/></button>
                    <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/80 to-transparent w-full">
                        <h2 className="text-3xl text-white font-bold">{selectedProject.title}</h2>
                    </div>
                </div>
                <div className="p-8 space-y-8">
                    <p className="text-lg text-muted-foreground">{selectedProject.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProject.images.map((img, i) => (
                            <img key={i} src={img} className="w-full rounded-lg" />
                        ))}
                    </div>
                </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
      
    </Section>
  );
}
