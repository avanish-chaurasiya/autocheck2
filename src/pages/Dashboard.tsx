import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, History, ClipboardCheck, TrendingUp } from "lucide-react";

interface User {
  email: string;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Mock stats
  const stats = [
    { label: "Total Evaluations", value: "0", icon: ClipboardCheck },
    { label: "This Month", value: "0", icon: TrendingUp },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Ready to evaluate some answer sheets? Choose an action below.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="glass-card animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-up"
            style={{ animationDelay: "0.2s" }}
            onClick={() => navigate("/evaluate")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-primary-gradient shadow-lg mb-4 group-hover:scale-105 transition-transform">
                <FileText className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-xl">Evaluate Answer Sheet</CardTitle>
              <CardDescription>
                Upload a student's answer sheet and answer key to get instant AI-powered evaluation with detailed marks breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full sm:w-auto">
                Start Evaluation
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-up"
            style={{ animationDelay: "0.3s" }}
            onClick={() => navigate("/history")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-accent-gradient shadow-lg mb-4 group-hover:scale-105 transition-transform">
                <History className="h-7 w-7 text-accent-foreground" />
              </div>
              <CardTitle className="font-display text-xl">Evaluation History</CardTitle>
              <CardDescription>
                View all past evaluations, search by roll number or subject, and download PDF reports anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full sm:w-auto">
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
