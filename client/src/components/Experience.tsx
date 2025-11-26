import { Section, FadeIn } from "@/components/ui/layout-components";
import { PERSONAL_DETAILS } from "@/data/resume";
import { Briefcase } from "lucide-react";

export function Experience() {
  return (
    <Section id="experience" className="py-20 bg-gradient-to-b from-transparent via-white/5 to-transparent">
      <FadeIn>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Experience</h2>
          <p className="text-muted-foreground">My professional journey and career highlights.</p>
        </div>
      </FadeIn>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
          {PERSONAL_DETAILS.experience.map((exp, i) => (
            <FadeIn key={i} delay={i * 0.2} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon on Timeline */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/30 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              
              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-6 rounded-xl border border-white/5 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <h3 className="font-bold text-lg text-foreground">{exp.role}</h3>
                  <time className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-full mt-2 sm:mt-0">{exp.period}</time>
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-3">{exp.company}</div>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
}
