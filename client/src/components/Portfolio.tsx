import { useState, useEffect } from "react";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { CATEGORIES } from "@/data/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Settings, Folder, Image as ImageIcon, ArrowLeft, X, AlertTriangle, Loader2, Link as LinkIcon } from "lucide-react";
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

// Types
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

  // FIXED: Simplified Navigation State
  const [currentView, setCurrentView] = useState<"repositories" | "projects">("repositories");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // FIXED: Consolidated Form States
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  
  // Manual Image URL State
  const [manualRepoImage, setManualRepoImage] = useState("");
  const [manualProjectImage, setManualProjectImage] = useState("");

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
    images: string[];
  }>({
    title: "", description: "", images: []
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

  // --- Image Upload Helper with Compression ---
  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Compression failed:", error);
      return file;
    }
  };

  const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    try {
        setUploadProgress("Compressing...");
        const compressedFile = await compressImage(file);
        
        setUploadProgress("Uploading...");
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        const url = await getDownloadURL(snapshot.ref);
        return url;
    } catch (error: any) {
        console.error("Upload failed:", error);
        if (error.code === 'storage/unauthorized') {
            throw new Error("Permission denied. Check Firebase Storage Rules.");
        }
        throw error;
    }
  };

  // --- Repository Management ---
  const handleAddRepository = async () => {
    const finalCoverImage = manualRepoImage || newRepo.coverImage;

    if (!newRepo.title || !finalCoverImage) {
      toast({ title: "Error", description: "Title and Cover Image (Upload or URL) are required.", variant: "destructive" });
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
      console.error("Error adding repo: ", error);
      toast({ title: "Error", description: `Failed to create repository: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
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
    // Combine uploaded images with manually added URL if present
    let finalImages = [...newProject.images];
    if (manualProjectImage) {
        finalImages.push(manualProjectImage);
    }

    if (!newProject.title || finalImages.length === 0) {
      toast({ title: "Error", description: "Title and at least one image (Upload or URL) are required.", variant: "destructive" });
      return;
    }
    
    if (!selectedRepo?.id) return;

    try {
      setIsUploading(true);
      await addDoc(collection(db, "repositories", selectedRepo.id, "projects"), {
        title: newProject.title,
        description: newProject.description || "",
        images: finalImages,
        createdAt: serverTimestamp()
      });

      setNewProject({ title: "", description: "", images: [] });
      setManualProjectImage("");
      setNewProjectOpen(false);
      toast({ title: "Success", description: "Project added to repository." });
    } catch (error: any) {
      console.error("Error adding project: ", error);
      toast({ title: "Error", description: `Failed to add project: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
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

  // FIXED: Navigation handler
  const handleBackToRepositories = () => {
    setCurrentView("repositories");
    setSelectedRepo(null);
    setSelectedProject(null);
  };

  // FIXED: Repository click handler
  const handleRepositoryClick = (repo: Repository) => {
    setSelectedRepo(repo);
    setCurrentView("projects");
  };

  // FIXED: Reset new project form
  const resetNewProjectForm = () => {
    setNewProject({ title: "", description: "", images: [] });
    setManualProjectImage("");
  };

  // --- Rendering Helpers ---
  const filteredRepos = activeCategory === "All" 
    ? repositories 
    : repositories.filter(r => r.category === activeCategory);

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20">
      {/* Header & Controls */}
      <div className="flex justify-between items-end mb-8">
        <div>
          {currentView === "projects" && (
            <Button 
              variant="ghost" 
              onClick={handleBackToRepositories}
              className="pl-0 hover:bg-transparent hover:text-primary mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Repositories
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
              <span>Cloud Sync Active</span>
            </div>
            <p className="opacity-80 max-w-lg">
              You are connected to the database. Changes will update live across all devices.
            </p>
          </div>
        </FadeIn>
      )}

      <FadeIn>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {currentView === "repositories" ? "Selected Work" : selectedRepo?.title}
          </h2>
          <p className="text-muted-foreground">
            {currentView === "repositories" 
              ? "A showcase of my recent projects and designs." 
              : selectedRepo?.description}
          </p>
        </div>
      </FadeIn>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* VIEW 1: REPOSITORIES */}
      {!loading && currentView === "repositories" && (
        <>
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
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                  <DialogTitle>Create New Repository</DialogTitle>
                  <DialogDescription>Repositories are folders that contain multiple projects.</DialogDescription>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Repository Title</Label>
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
                      <Label>Cover Image</Label>
                      
                      {/* OPTION 1: UPLOAD */}
                      <div className="border border-border rounded-md p-3 bg-muted/30 mb-2">
                        <Label className="text-xs text-muted-foreground mb-2 block">Option 1: Upload Image</Label>
                        <div className="flex gap-2">
                            <Input 
                            type="file" 
                            accept="image/*"
                            disabled={isUploading}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                setIsUploading(true);
                                try {
                                    const url = await uploadImageToStorage(file, `covers/${Date.now()}_${file.name}`);
                                    setNewRepo({...newRepo, coverImage: url});
                                    setManualRepoImage(""); // Clear manual input if upload succeeds
                                } catch (err: any) {
                                    toast({ title: "Upload Error", description: err.message, variant: "destructive" });
                                } finally {
                                    setIsUploading(false);
                                    setUploadProgress("");
                                }
                                }
                            }}
                            />
                        </div>
                        {isUploading && <span className="text-xs text-primary animate-pulse">{uploadProgress}</span>}
                      </div>

                      {/* OPTION 2: URL PASTE */}
                      <div className="border border-border rounded-md p-3 bg-muted/30">
                        <Label className="text-xs text-muted-foreground mb-2 block">Option 2: Paste Image Link</Label>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                <Input 
                                    placeholder="https://example.com/image.jpg (Must be direct link)" 
                                    value={manualRepoImage}
                                    onChange={(e) => {
                                        setManualRepoImage(e.target.value);
                                        setNewRepo({...newRepo, coverImage: ""}); 
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Note: Ensure the link ends in .jpg, .png, or .webp and is publicly accessible.
                            </p>
                        </div>
                      </div>

                      {/* PREVIEW */}
                      {(newRepo.coverImage || manualRepoImage) && (
                        <div className="mt-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
                            <div className="relative h-24 w-24">
                                <img 
                                    src={newRepo.coverImage || manualRepoImage} 
                                    className="h-full w-full object-cover rounded-md border border-border" 
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.querySelector('.error-fallback')?.classList.remove('hidden');
                                    }}
                                />
                                <div className="error-fallback hidden absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-xs text-center p-1 rounded-md border border-destructive/20">
                                    Invalid Image Link
                                </div>
                            </div>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input 
                        value={newRepo.description}
                        onChange={(e) => setNewRepo({...newRepo, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddRepository} disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Create Repository"}
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
                    className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full opacity-100 shadow-lg"
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
                  className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3]"
                >
                  <img 
                    src={repo.coverImage} 
                    alt={repo.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                    <Folder className="text-white w-8 h-8 mb-2" />
                    <h3 className="text-white font-display font-bold text-xl mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{repo.title}</h3>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </>
      )}

      {/* VIEW 2: PROJECTS INSIDE REPOSITORY */}
      {!loading && currentView === "projects" && selectedRepo && (
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
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogTitle>Add Project to {selectedRepo.title}</DialogTitle>
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
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Project Images (Max 7) *</Label>
                    
                    {/* OPTION 1: UPLOAD */}
                    <div className="border border-border rounded-md p-3 bg-muted/30 mb-2">
                      <Label className="text-xs text-muted-foreground mb-2 block">Option 1: Upload Images</Label>
                      <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          disabled={isUploading}
                          onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                              setIsUploading(true);
                              try {
                              // Limit to 7 images total
                              const availableSlots = 7 - newProject.images.length;
                              const filesToUpload = files.slice(0, availableSlots);
                              
                              const uploadPromises = filesToUpload.map(file => 
                                  uploadImageToStorage(file, `projects/${selectedRepo.id}/${Date.now()}_${file.name}`)
                              );
                              const urls = await Promise.all(uploadPromises);
                              setNewProject(prev => ({...prev, images: [...prev.images, ...urls]}));
                              
                              if (files.length > availableSlots) {
                                  toast({ 
                                    title: "Limit Reached", 
                                    description: `Only ${availableSlots} images were added. Maximum 7 images allowed.`,
                                    variant: "default"
                                  });
                              }
                              } catch (err: any) {
                              toast({ title: "Upload Error", description: err.message, variant: "destructive" });
                              } finally {
                              setIsUploading(false);
                              setUploadProgress("");
                              }
                          }
                          }}
                      />
                      {isUploading && <span className="text-xs text-primary animate-pulse">{uploadProgress}</span>}
                    </div>

                    {/* OPTION 2: PASTE URL */}
                    <div className="border border-border rounded-md p-3 bg-muted/30">
                      <Label className="text-xs text-muted-foreground mb-2 block">Option 2: Paste Image Link</Label>
                      <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                              <Input 
                                  placeholder="https://example.com/image.jpg"
                                  value={manualProjectImage}
                                  onChange={(e) => setManualProjectImage(e.target.value)}
                                  disabled={newProject.images.length >= 7}
                              />
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => {
                                    if (manualProjectImage && newProject.images.length < 7) {
                                        setNewProject(prev => ({...prev, images: [...prev.images, manualProjectImage]}));
                                        setManualProjectImage("");
                                    } else if (newProject.images.length >= 7) {
                                        toast({ 
                                          title: "Limit Reached", 
                                          description: "Maximum 7 images allowed per project.",
                                          variant: "destructive" 
                                        });
                                    }
                                }}
                                disabled={!manualProjectImage || newProject.images.length >= 7}
                              >
                                Add
                              </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                              Note: Ensure the link ends in .jpg, .png, or .webp and is publicly accessible.
                          </p>
                      </div>
                    </div>

                    {/* IMAGE PREVIEWS */}
                    {newProject.images.length > 0 && (
                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Selected Images ({newProject.images.length}/7)
                        </Label>
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {newProject.images.map((img, i) => (
                            <div key={i} className="relative shrink-0 h-20 w-20">
                               <img 
                                  src={img} 
                                  className="h-full w-full object-cover rounded-md border border-border" 
                                  onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/100x100?text=Error";
                                  }}
                               />
                               <button 
                                 onClick={() => setNewProject(prev => ({
                                   ...prev, 
                                   images: prev.images.filter((_, idx) => idx !== i)
                                 }))} 
                                 className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                               >
                                 <X className="w-3 h-3" />
                               </button>
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
                    disabled={isUploading || !newProject.title || newProject.images.length === 0}
                  >
                    {isUploading ? "Uploading..." : "Add Project"}
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
                  className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full opacity-100 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <div 
                onClick={() => setSelectedProject(project)}
                className="cursor-pointer relative overflow-hidden rounded-xl bg-muted aspect-[4/3]"
              >
                <img 
                  src={project.images[0]} 
                  alt={project.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                  <h3 className="text-white font-display font-bold text-xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{project.title}</h3>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}

      {/* PROJECT DETAIL MODAL - Full Screen */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => {
        if (!open) setSelectedProject(null);
      }}>
        <DialogContent className="!fixed !inset-0 !left-auto !top-auto !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !p-0 !flex !flex-col !bg-background !border-0 !shadow-none !rounded-none !z-[200] !m-0 !gap-0">
          {selectedProject && (
            <div className="flex flex-col h-full w-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
              <div className="relative shrink-0 h-64 md:h-96 w-full">
                 <img 
                   src={selectedProject.images[0]} 
                   alt={selectedProject.title} 
                   className="w-full h-full object-cover"
                 />
                 <button 
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
                 <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent flex flex-col justify-end p-8">
                   <h2 className="text-3xl font-display font-bold mb-2">{selectedProject.title}</h2>
                 </div>
              </div>
              <div className="p-8">
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  {selectedProject.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProject.images.map((img, i) => (
                    <img key={i} src={img} className="w-full rounded-lg border border-white/10" />
                  ))}
                </div>

                <div className="mt-12 flex justify-end pb-8">
                  <Button size="lg" onClick={() => {
                     setSelectedProject(null);
                     const contactSection = document.getElementById("contact");
                     if (contactSection) {
                       contactSection.scrollIntoView({ behavior: "smooth" });
                       setTimeout(() => {
                          window.dispatchEvent(new CustomEvent("prefillContact", { 
                            detail: { subject: `Inquiry about: ${selectedProject.title}` } 
                          }));
                       }, 500);
                     }
                  }}>
                    Inquire About This Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
