import { Section, FadeIn } from "@/components/ui/layout-components";
import { PERSONAL_DETAILS } from "@/data/resume";
import { CheckCircle2 } from "lucide-react";

export function About() {
  return (
    <Section id="about" className="bg-gradient-to-br from-white/5 via-white/2 to-transparent rounded-3xl my-20 border border-white/10 shadow-lg backdrop-blur-sm">
      <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <FadeIn>
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">About Me</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {PERSONAL_DETAILS.about}
            </p>
            
            <div className="pt-6">
              <h3 className="text-lg font-bold mb-4 font-display">Education</h3>
              <div className="space-y-4">
                {PERSONAL_DETAILS.education.map((edu, i) => (
                  <div key={i} className="bg-background/50 p-4 rounded-lg border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold">{edu.degree}</h4>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{edu.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="bg-background/30 p-8 rounded-2xl border border-white/5">
            <h3 className="text-xl font-display font-bold mb-6">Skills & Expertise</h3>
            <div className="grid grid-cols-1 gap-4">
              {PERSONAL_DETAILS.skills.map((skill, i) => (
                <div key={skill} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-base font-medium">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
