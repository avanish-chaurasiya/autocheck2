import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, FileText, Inbox, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Evaluation {
  id: string;
  student_roll_number: string;
  subject: string;
  total_marks: number;
  max_marks: number;
  evaluated_at: string;
  pdf_report_url: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchEvaluations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("user_id", user.id)
        .order("evaluated_at", { ascending: false });

      if (!error && data) {
        setEvaluations(data);
      }
      setLoading(false);
    };

    fetchEvaluations();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEvaluations = evaluations.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.student_roll_number.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query)
    );
  });

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="glass-card animate-fade-up">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-display">Evaluation History</CardTitle>
                <CardDescription>
                  View and download all past evaluation reports.
                </CardDescription>
              </div>
              <Button variant="hero" onClick={() => navigate("/evaluate")}>
                <FileText className="h-4 w-4" />
                New Evaluation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by roll number or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEvaluations.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((item, index) => {
                      const percentage = Math.round((Number(item.total_marks) / Number(item.max_marks)) * 100);
                      return (
                        <TableRow 
                          key={item.id} 
                          className="animate-fade-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <TableCell className="font-medium">{item.student_roll_number}</TableCell>
                          <TableCell>{item.subject}</TableCell>
                          <TableCell className="text-center">
                            {item.total_marks} / {item.max_marks}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              percentage >= 80 
                                ? "bg-success/10 text-success" 
                                : percentage >= 50 
                                ? "bg-accent/10 text-accent" 
                                : "bg-destructive/10 text-destructive"
                            }`}>
                              {percentage}%
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(item.evaluated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={!item.pdf_report_url}
                              onClick={() => item.pdf_report_url && window.open(item.pdf_report_url, "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "No results found" : "No evaluations yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery 
                    ? "Try adjusting your search query to find what you're looking for."
                    : "Start by evaluating your first answer sheet to see it here."
                  }
                </p>
                {!searchQuery && (
                  <Button variant="hero" onClick={() => navigate("/evaluate")}>
                    <FileText className="h-4 w-4" />
                    Evaluate First Paper
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default History;
