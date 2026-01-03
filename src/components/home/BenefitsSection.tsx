import { Clock, Scale, Eye, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save Hours Weekly",
    description: "Reduce grading time by up to 70%. Evaluate more papers in less time without sacrificing quality.",
  },
  {
    icon: Scale,
    title: "Ensure Consistency",
    description: "AI-powered evaluation applies the same standards to every paper, eliminating subjective bias.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Detailed PDF reports show exactly how marks were allocated, making it easy to address student queries.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Historical data helps identify learning patterns and areas where students need more support.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How It Helps Teachers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Designed by educators, for educators. Focus on teaching while we handle the paperwork.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="flex gap-4 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl btn-accent-gradient shadow-md">
                  <benefit.icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
