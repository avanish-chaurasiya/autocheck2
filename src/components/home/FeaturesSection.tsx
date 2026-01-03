import { FileText, Brain, History, Shield } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "OCR-Based Scanning",
    description: "Advanced optical character recognition extracts text from handwritten and printed answer sheets with high accuracy.",
  },
  {
    icon: Brain,
    title: "AI-Assisted Marking",
    description: "Intelligent algorithms compare student answers against answer keys, providing fair and consistent evaluation.",
  },
  {
    icon: History,
    title: "Complete History",
    description: "Access all past evaluations, search by roll number or subject, and track student performance over time.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "All student data is encrypted and securely stored. Your evaluation records are always protected.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Powerful Features for Educators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline your grading process and focus on what matters most — teaching.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
