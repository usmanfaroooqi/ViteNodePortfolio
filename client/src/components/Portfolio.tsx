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
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Project { id: string; title: string; description: string; images: string[]; }
export interface Repository { id: string; title: string; description: string; category: string; coverImage: string; }

export default function Portfolio() {
  const { toast } = useToast();

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Admin password
  const [adminPassword, setAdminPassword] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // View state
  const [currentView, setCurrentView] = useState<"repositories" | "projects">("repositories");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Dialogs
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [manualRepoImage, setManualRepoImage] = useState("");
  const [manualProjectImage, setManualProjectImage] = useState("");

  // New repository & project
  const [newRepo, setNewRepo] = useState<Partial<Repository>>({ title: "", description: "", category: "Branding", coverImage: "" });
  const [newProject, setNewProject] = useState<{ title: string; description: string; images: string[] }>({ title: "", description: "", images: [] });

  // --- Firebase Listeners ---
  useEffect(() => {
    const q = query(collection(db, "repositories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q,
      (snapshot) => { setRepositories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repository))); setLoading(false); setFirebaseError(null); },
      (error) => { setLoading(false); setFirebaseError(error.message); console.error(error); }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedRepoId) return setProjects([]);
    const q = query(collection(db, "repositories", selectedRepoId, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => { setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project))); });
    return () => unsubscribe();
  }, [selectedRepoId]);

  // --- Image Upload ---
  const compressImage = async (file: File) => {
    try { return await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 }); }
    catch { return file; }
  };
  const uploadImageToStorage = async (file: File, path: string) => {
    setUploadProgress("Compressing..."); setIsUploading(true);
    const compressed = await compressImage(file);
    setUploadProgress("Uploading...");
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, compressed);
    const url = await getDownloadURL(snapshot.ref);
    setIsUploading(false); setUploadProgress(""); return url;
  };

  // --- Auth & Password ---
  const handleLogin = () => {
    const storedPassword = localStorage.getItem("adminPassword") || "usman2006";
    if (adminPassword === storedPassword) { setIsAuthenticated(true); setIsEditMode(true); setAuthDialogOpen(false); toast({ title: "Success", description: "Admin mode enabled." }); }
    else toast({ title: "Error", description: "Invalid password", variant: "destructive" });
  };
  const handleChangePassword = () => {
    const storedPassword = localStorage.getItem("adminPassword") || "usman2006";
    if (currentPasswordInput !== storedPassword) return toast({ title: "Error", description: "Current password incorrect.", variant: "destructive" });
    if (newPasswordInput.length < 4) return toast({ title: "Error", description: "New password must be at least 4 characters.", variant: "destructive" });
    localStorage.setItem("adminPassword", newPasswordInput);
    toast({ title: "Success", description: "Password updated successfully." });
    setChangePasswordOpen(false); setCurrentPasswordInput(""); setNewPasswordInput("");
  };

  // --- Repository Management ---
  const handleAddRepository = async () => {
    const finalCoverImage = manualRepoImage || newRepo.coverImage;
    if (!newRepo.title || !finalCoverImage) return toast({ title: "Error", description: "Title and Cover Image required.", variant: "destructive" });
    try {
      await addDoc(collection(db, "repositories"), { ...newRepo, coverImage: finalCoverImage, createdAt: serverTimestamp() });
      setNewRepo({ title: "", description: "", category: "Branding", coverImage: "" });
      setManualRepoImage(""); setNewRepoOpen(false);
      toast({ title: "Success", description: "Repository created." });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };
  const handleDeleteRepository = async (id: string) => { if (confirm("Delete this repository?")) { await deleteDoc(doc(db, "repositories", id)); toast({ title: "Deleted", description: "Repository removed." }); } };

  // --- Project Management ---
  const handleAddProject = async () => {
    const finalImages = [...newProject.images]; if (manualProjectImage) finalImages.push(manualProjectImage);
    if (!newProject.title || finalImages.length === 0) return toast({ title: "Error", description: "Title and at least one image required.", variant: "destructive" });
    if (!selectedRepoId) return;
    try {
      await addDoc(collection(db, "repositories", selectedRepoId, "projects"), { ...newProject, images: finalImages, createdAt: serverTimestamp() });
      setNewProject({ title: "", description: "", images: [] }); setManualProjectImage(""); setNewProjectOpen(false);
      toast({ title: "Success", description: "Project added." });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };
  const handleDeleteProject = async (projectId: string) => { if (selectedRepoId && confirm("Delete this project?")) { await deleteDoc(doc(db, "repositories", selectedRepoId, "projects", projectId)); toast({ title: "Deleted", description: "Project removed." }); } };

  const activeRepo = repositories.find(r => r.id === selectedRepoId);
  const filteredRepos = activeCategory === "All" ? repositories : repositories.filter(r => r.category === activeCategory);

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Portfolio</h2>
        {isEditMode && (
          <div className="flex gap-2">
            <Button onClick={() => setNewRepoOpen(true)}>+ New Repository</Button>
            <Button onClick={() => setChangePasswordOpen(true)}>Change Password</Button>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        {["All", ...CATEGORIES].map(cat => (
          <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} onClick={() => setActiveCategory(cat)}>
            {cat}
          </Button>
        ))}
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredRepos.map(repo => (
          <FadeIn key={repo.id}>
            <div className="bg-white/20 rounded-xl p-4 flex flex-col">
              <img src={repo.coverImage} alt={repo.title} className="rounded-lg h-40 object-cover mb-4" />
              <h3 className="font-semibold text-xl">{repo.title}</h3>
              <p className="text-sm text-muted-foreground">{repo.description}</p>
              <div className="mt-4 flex justify-between">
                <Button size="sm" onClick={() => { setSelectedRepoId(repo.id); setCurrentView("projects"); }}>View Projects</Button>
                {isEditMode && <Button size="sm" variant="destructive" onClick={() => handleDeleteRepository(repo.id)}><Trash2 size={16} /></Button>}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Projects Grid */}
      {currentView === "projects" && activeRepo && (
        <>
          <div className="flex items-center gap-4 mt-8 mb-4">
            <Button variant="ghost" onClick={() => { setCurrentView("repositories"); setSelectedRepoId(null); }}><ArrowLeft /> Back</Button>
            <h3 className="text-2xl font-bold">{activeRepo.title} - Projects</h3>
            {isEditMode && <Button onClick={() => setNewProjectOpen(true)}>+ New Project</Button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map(project => (
              <FadeIn key={project.id}>
                <div className="bg-white/20 rounded-xl p-4 flex flex-col cursor-pointer" onClick={() => setSelectedProject(project)}>
                  <img src={project.images[0]} alt={project.title} className="rounded-lg h-40 object-cover mb-4" />
                  <h4 className="font-semibold">{project.title}</h4>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                  {isEditMode && <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(project.id)}><Trash2 size={16} /></Button>}
                </div>
              </FadeIn>
            ))}
          </div>
        </>
      )}

      {/* --- Dialogs: Add Repo --- */}
      <Dialog open={newRepoOpen} onOpenChange={setNewRepoOpen}>
        <DialogContent>
          <DialogTitle>New Repository</DialogTitle>
          <div className="flex flex-col gap-3 mt-4">
            <Label>Title</Label>
            <Input value={newRepo.title} onChange={(e) => setNewRepo({ ...newRepo, title: e.target.value })} />
            <Label>Description</Label>
            <Textarea value={newRepo.description} onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })} />
            <Label>Cover Image URL</Label>
            <Input value={manualRepoImage} placeholder="Or provide URL..." onChange={(e) => setManualRepoImage(e.target.value)} />
            <Label>Category</Label>
            <Input value={newRepo.category} onChange={(e) => setNewRepo({ ...newRepo, category: e.target.value })} />
            <Button onClick={handleAddRepository}>Add Repository</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Dialogs: Add Project --- */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent>
          <DialogTitle>New Project</DialogTitle>
          <div className="flex flex-col gap-3 mt-4">
            <Label>Title</Label>
            <Input value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
            <Label>Description</Label>
            <Textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
            <Label>Images (URLs)</Label>
            <Input value={manualProjectImage} placeholder="Add URL..." onChange={(e) => setManualProjectImage(e.target.value)} />
            <Button onClick={handleAddProject}>Add Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Dialogs: Change Password --- */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogTitle>Change Password</DialogTitle>
          <div className="flex flex-col gap-3 mt-4">
            <Label>Current Password</Label>
            <Input type="password" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} />
            <Label>New Password</Label>
            <Input type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} />
            <Button onClick={handleChangePassword}>Change Password</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Project Detail Modal --- */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>{selectedProject.title}</DialogTitle>
            <p className="mb-4">{selectedProject.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedProject.images.map((img, idx) => <img key={idx} src={img} className="rounded-lg" />)}
            </div>
            <Button className="mt-4" onClick={() => setSelectedProject(null)}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </Section>
  );
}
