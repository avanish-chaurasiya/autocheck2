import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, History, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: totalCount } = await supabase
        .from("evaluations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: monthCount } = await supabase
        .from("evaluations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        total: totalCount || 0,
        thisMonth: monthCount || 0,
      });
    };

    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Teacher";

  const statsCards = [
    { label: "Total Evaluations", value: stats.total.toString(), icon: ClipboardCheck },
    { label: "This Month", value: stats.thisMonth.toString(), icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Ready to evaluate some answer sheets? Choose an action below.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {statsCards.map((stat, index) => (
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
