import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-semibold text-foreground">
              AutoCheck
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Automatic Student Answer Sheet Evaluation System. 
            Built for educators.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
