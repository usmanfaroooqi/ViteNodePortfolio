import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { CATEGORIES } from "@/data/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Settings, Folder, ArrowLeft, AlertTriangle, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

export interface Repository {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  createdAt: any;
}

export function PortfolioRepositories() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [manualRepoImage, setManualRepoImage] = useState("");
  
  const [newRepo, setNewRepo] = useState<Partial<Repository>>({
    title: "", description: "", category: "Branding", coverImage: ""
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
           setFirebaseError("Permission denied. Please enable Firestore Database.");
        } else {
           setFirebaseError(`Database Error: ${error.message}`);
        }
      }
    );
    return () => unsubscribe();
  }, []);

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
    if (confirm("Delete this repository?")) {
      try {
        await deleteDoc(doc(db, "repositories", id));
        toast({ title: "Deleted", description: "Repository removed." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete repository.", variant: "destructive" });
      }
    }
  };

  const handleRepositoryClick = (repo: Repository) => {
    navigate(`/portfolio/${repo.id}`);
  };

  const filteredRepos = activeCategory === "All" 
    ? repositories 
    : repositories.filter(r => r.category === activeCategory);

  return (
    <Section id="portfolio" className="bg-gradient-to-b from-white/3 via-white/2 to-transparent rounded-3xl my-20">
      {/* Header & Controls */}
      <div className="flex justify-between items-end mb-8">
        <div></div>
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

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </Section>
  );
}