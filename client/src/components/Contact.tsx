import { useState, useEffect } from "react";
import { Section, FadeIn } from "@/components/ui/layout-components";
import { PERSONAL_DETAILS } from "@/data/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [defaultSubject, setDefaultSubject] = useState("");

  useEffect(() => {
    const handlePrefill = (e: CustomEvent) => {
      if (e.detail && e.detail.subject) {
        setDefaultSubject(e.detail.subject);
      }
    };
    
    window.addEventListener("prefillContact" as any, handlePrefill as any);
    return () => {
      window.removeEventListener("prefillContact" as any, handlePrefill as any);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xldopzby", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSent(true);
        form.reset();
        setDefaultSubject(""); // Reset subject after send
      } else {
        alert("Oops! There was a problem sending your form");
      }
    } catch (error) {
      alert("Oops! There was a problem sending your form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="contact" className="pb-32 bg-gradient-to-t from-white/5 to-transparent">
      <FadeIn>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Let's Work Together</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Have a project in mind? I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
          </p>
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-2 gap-12">
        <FadeIn delay={0.2}>
          <div className="space-y-8">
             <div className="flex items-start gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                 <Mail className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <h3 className="font-bold text-lg mb-1">Email Me</h3>
                 <a href={`mailto:${PERSONAL_DETAILS.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                   {PERSONAL_DETAILS.email}
                 </a>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                 <Phone className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <h3 className="font-bold text-lg mb-1">Call Me</h3>
                 <a href={`tel:${PERSONAL_DETAILS.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                   {PERSONAL_DETAILS.phone}
                 </a>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                 <MapPin className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <h3 className="font-bold text-lg mb-1">Location</h3>
                 <p className="text-muted-foreground">
                   Available for remote work worldwide.
                 </p>
               </div>
             </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input name="name" placeholder="Your name" required className="bg-background/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" placeholder="Your email" type="email" required className="bg-background/50 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    name="subject" 
                    placeholder="Project details" 
                    required 
                    className="bg-background/50 border-white/10" 
                    defaultValue={defaultSubject}
                    key={defaultSubject} // Force re-render when subject changes
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea name="message" placeholder="Tell me about your project..." required className="bg-background/50 border-white/10 min-h-[150px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-medium">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Sent Success Popup */}
      <Dialog open={isSent} onOpenChange={setIsSent}>
        <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-xl border-primary/20">
           <VisuallyHidden.Root>
             <DialogTitle>Message Sent</DialogTitle>
           </VisuallyHidden.Root>
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold">Message Sent!</h3>
            <p className="text-muted-foreground">
              Thank you for reaching out. I'll get back to you as soon as possible.
            </p>
            <Button className="mt-4" onClick={() => setIsSent(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
