import { Section, FadeIn } from "@/components/ui/layout-components";
import { Button } from "@/components/ui/button";
import { PERSONAL_DETAILS } from "@/data/resume";
import { ArrowRight, Instagram, Linkedin, Mail, Download } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_dark_graphic_design_background.png";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/90 to-background" />
      </div>

      <Section className="relative z-10 flex flex-col items-center text-center">
        <FadeIn delay={0.1}>
          {/* Profile Image with Theme-Matched Frame */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-10 mx-auto">
            {/* Outer glowing ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary to-transparent opacity-50 blur-md animate-pulse" />
            
            {/* Frame container */}
            <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
              <img 
                src="/profile-hero.jpg" 
                alt={PERSONAL_DETAILS.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tighter mb-6">
            {PERSONAL_DETAILS.name}
          </h1>
          <h2 className="text-2xl md:text-3xl text-primary font-light tracking-wide mb-8">
            {PERSONAL_DETAILS.role}
          </h2>
        </FadeIn>

        <FadeIn delay={0.3} className="max-w-2xl mx-auto mb-10">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            I craft clean, modern, and impactful visual identities that help brands stand out in the digital noise.
          </p>
        </FadeIn>

        <FadeIn delay={0.4} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="rounded-full text-base px-8 h-12 bg-foreground text-background hover:bg-foreground/90" onClick={() => document.getElementById('portfolio')?.scrollIntoView({behavior: 'smooth'})}>
            View Portfolio
          </Button>
          <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-white/20 hover:bg-white/10" onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})}>
            Contact Me <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a href="/resume.pdf" download="Usman_Farooqi_Resume.pdf" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-primary/30 hover:bg-primary/10 hover:text-primary w-full">
              <Download className="mr-2 h-4 w-4" /> Resume
            </Button>
          </a>
        </FadeIn>

        <FadeIn delay={0.6} className="mt-12 flex gap-6">
           {/* Social Links */}
           <a href={PERSONAL_DETAILS.social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-6 w-6" /></a>
           <a href={PERSONAL_DETAILS.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-6 w-6" /></a>
           <a href={`mailto:${PERSONAL_DETAILS.email}`} className="text-muted-foreground hover:text-primary transition-colors"><Mail className="h-6 w-6" /></a>
        </FadeIn>
      </Section>
    </section>
  );
}
