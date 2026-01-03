import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 btn-primary-gradient opacity-95" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
          Ready to Transform Your Grading?
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
          Join educators who are saving hours every week with intelligent answer sheet evaluation.
        </p>
        <Button
          variant="glass"
          size="xl"
          onClick={() => navigate("/auth")}
          className="bg-white/20 border-white/30 text-primary-foreground hover:bg-white/30"
        >
          Start Evaluating Now
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
