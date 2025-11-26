import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Portfolio } from "@/components/Portfolio";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Experience />
        <Portfolio />
        <Contact />
      </main>
      <footer className="py-8 border-t border-white/10 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} Usman Farooqi. All rights reserved.</p>
          <p className="mt-2 text-xs opacity-50">Designed & Built for Portfolio Showcase</p>
        </div>
      </footer>
    </div>
  );
}
