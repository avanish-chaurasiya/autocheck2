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
import { Search, Download, FileText, Inbox } from "lucide-react";

interface HistoryItem {
  id: string;
  rollNumber: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  date: string;
}

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }

    // Load history from localStorage
    const storedHistory = JSON.parse(localStorage.getItem("evaluationHistory") || "[]");
    setHistory(storedHistory);
    setFilteredHistory(storedHistory);
  }, [navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = history.filter(
        (item) =>
          item.rollNumber.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query)
      );
      setFilteredHistory(filtered);
    }
  }, [searchQuery, history]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

            {/* History Table */}
            {filteredHistory.length > 0 ? (
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
                    {filteredHistory.map((item, index) => (
                      <TableRow 
                        key={item.id} 
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell className="font-medium">{item.rollNumber}</TableCell>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell className="text-center">
                          {item.obtainedMarks} / {item.totalMarks}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.percentage >= 80 
                              ? "bg-success/10 text-success" 
                              : item.percentage >= 50 
                              ? "bg-accent/10 text-accent" 
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {item.percentage}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
