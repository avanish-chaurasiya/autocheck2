import { Upload, Cpu, FileDown, Archive } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "Upload",
    description: "Upload the answer key and student answer sheet (PDF or image)",
  },
  {
    step: 2,
    icon: Cpu,
    title: "Evaluate",
    description: "AI processes and compares answers using OCR technology",
  },
  {
    step: 3,
    icon: FileDown,
    title: "Report",
    description: "Download detailed PDF report with marks breakdown",
  },
  {
    step: 4,
    icon: Archive,
    title: "History",
    description: "Access all evaluations anytime from your dashboard",
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Simple 4-Step Workflow
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From upload to report in minutes. No complex setup, no learning curve.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div
                key={item.title}
                className="relative text-center animate-fade-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step circle */}
                <div className="relative z-10 mx-auto mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border-2 border-primary shadow-lg mx-auto">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full btn-primary-gradient text-xs font-bold">
                    {item.step}
                  </div>
                </div>

                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
