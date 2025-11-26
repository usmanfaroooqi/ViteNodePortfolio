// INSTRUCTIONS FOR OWNER:
// This file now uses a Repository -> Project structure.
// Repositories are like folders (e.g. "Branding 2024", "Logo Collection").
// Projects are items inside repositories.

export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[]; // Up to 4-5 images
}

export interface Repository {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  projects: Project[];
}

export const INITIAL_REPOSITORIES: Repository[] = [
  {
    id: "branding-kit",
    title: "Tech Startup Branding",
    description: "Complete identity design for a fintech startup.",
    category: "Branding",
    coverImage: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop",
    projects: [
      {
        id: "p1",
        title: "Logo Design",
        description: "Primary and secondary logo marks.",
        images: ["https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=2670&auto=format&fit=crop"]
      },
      {
        id: "p2",
        title: "Stationery",
        description: "Business cards, letterheads, and envelopes.",
        images: ["https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=2670&auto=format&fit=crop"]
      }
    ]
  },
  {
    id: "logos-2024",
    title: "Logo Collection 2024",
    description: "A curated collection of logo designs.",
    category: "Logos",
    coverImage: "/portfolio/nasheed-hub-logo.jpg",
    projects: [
      {
        id: "nasheed-hub",
        title: "Nasheed Hub",
        description: "Gold and black luxury logo design featuring custom Arabic calligraphy.",
        images: ["/portfolio/nasheed-hub-logo.jpg"]
      },
      {
        id: "arabic-cal",
        title: "Geometric Calligraphy",
        description: "Modern geometric Arabic calligraphy design.",
        images: ["/portfolio/arabic-calligraphy-logo.jpg"]
      },
      {
        id: "al-qudsu",
        title: "Al Qudsu Lana",
        description: "Typography-based logo design.",
        images: ["/portfolio/al-qudsu-lana-logo.jpg"]
      }
    ]
  }
];

export const CATEGORIES = ["All", "Branding", "Social Media", "Packaging", "Print", "Logos"];
