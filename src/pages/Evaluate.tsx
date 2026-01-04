import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface EvaluationResult {
  rollNumber: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  pdfReportUrl?: string;
}

const Evaluate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    totalMarks: "",
    rollNumber: "",
  });
  const [answerKey, setAnswerKey] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "key" | "sheet") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "key") {
        setAnswerKey(file);
      } else {
        setAnswerSheet(file);
      }
    }
  };

  const generatePdfReport = async (evaluationResult: EvaluationResult): Promise<Blob> => {
    // Generate a simple PDF report content
    // In production, this would use a proper PDF library or backend service
    const content = `
EVALUATION REPORT
=================

Student Roll Number: ${evaluationResult.rollNumber}
Subject: ${evaluationResult.subject}
Date: ${new Date().toLocaleDateString()}

RESULTS
-------
Total Marks: ${evaluationResult.totalMarks}
Marks Obtained: ${evaluationResult.obtainedMarks}
Percentage: ${evaluationResult.percentage}%

Grade: ${evaluationResult.percentage >= 90 ? 'A+' : 
        evaluationResult.percentage >= 80 ? 'A' :
        evaluationResult.percentage >= 70 ? 'B' :
        evaluationResult.percentage >= 60 ? 'C' :
        evaluationResult.percentage >= 50 ? 'D' : 'F'}

This report was generated automatically by the AI Paper Evaluation System.
    `;
    
    return new Blob([content], { type: 'application/pdf' });
  };

  const uploadPdfReport = async (pdfBlob: Blob, rollNumber: string, subject: string): Promise<string | null> => {
    if (!user) return null;

    const timestamp = Date.now();
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${user.id}/${rollNumber}_${sanitizedSubject}_${timestamp}.pdf`;

    const { data, error } = await supabase.storage
      .from('evaluated-pdf-reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('evaluated-pdf-reports')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  };

  const saveEvaluationToDatabase = async (
    evaluationResult: EvaluationResult,
    pdfUrl: string | null
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('evaluations')
      .insert({
        user_id: user.id,
        student_roll_number: evaluationResult.rollNumber,
        subject: evaluationResult.subject,
        max_marks: evaluationResult.totalMarks,
        total_marks: evaluationResult.obtainedMarks,
        pdf_report_url: pdfUrl,
      });

    if (error) {
      console.error('Error saving evaluation:', error);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Please log in to evaluate papers.",
      });
      navigate("/auth");
      return;
    }

    if (!formData.subject || !formData.totalMarks || !formData.rollNumber) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (!answerKey || !answerSheet) {
      toast({
        variant: "destructive",
        title: "Missing Files",
        description: "Please upload both the answer key and student answer sheet.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate AI evaluation (in production, this would call a backend API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalMarks = parseInt(formData.totalMarks);
      const obtainedMarks = Math.floor(Math.random() * (totalMarks * 0.4) + totalMarks * 0.5);
      
      const evaluationResult: EvaluationResult = {
        rollNumber: formData.rollNumber,
        subject: formData.subject,
        totalMarks: totalMarks,
        obtainedMarks: obtainedMarks,
        percentage: Math.round((obtainedMarks / totalMarks) * 100),
      };

      // Generate and upload PDF report
      const pdfBlob = await generatePdfReport(evaluationResult);
      const pdfUrl = await uploadPdfReport(pdfBlob, formData.rollNumber, formData.subject);

      // Save evaluation to database
      const saved = await saveEvaluationToDatabase(evaluationResult, pdfUrl);

      if (!saved) {
        throw new Error('Failed to save evaluation');
      }

      setResult({
        ...evaluationResult,
        pdfReportUrl: pdfUrl || undefined,
      });

      toast({
        title: "Evaluation Complete",
        description: "The answer sheet has been evaluated and saved successfully.",
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description: "An error occurred during evaluation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ subject: "", totalMarks: "", rollNumber: "" });
    setAnswerKey(null);
    setAnswerSheet(null);
    setResult(null);
  };

  const handleDownloadPdf = () => {
    if (result?.pdfReportUrl) {
      window.open(result.pdfReportUrl, '_blank');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {!result ? (
          <Card className="glass-card animate-fade-up">
            <CardHeader>
              <CardTitle className="text-2xl font-display">Evaluate Answer Sheet</CardTitle>
              <CardDescription>
                Upload the answer key and student's answer sheet to begin AI-powered evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject & Total Marks */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Mathematics"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalMarks">Total Marks *</Label>
                    <Input
                      id="totalMarks"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                </div>

                {/* Roll Number */}
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Student Roll Number *</Label>
                  <Input
                    id="rollNumber"
                    placeholder="e.g., 2024CS001"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    required
                  />
                </div>

                {/* File Uploads */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Answer Key Upload */}
                  <div className="space-y-2">
                    <Label>Answer Key (PDF/Text) *</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {answerKey ? (
                          <>
                            <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                            <p className="text-sm text-foreground font-medium truncate max-w-[150px]">
                              {answerKey.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt"
                        onChange={(e) => handleFileChange(e, "key")}
                      />
                    </label>
                  </div>

                  {/* Answer Sheet Upload */}
                  <div className="space-y-2">
                    <Label>Student Answer Sheet (PDF/Image) *</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {answerSheet ? (
                          <>
                            <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                            <p className="text-sm text-foreground font-medium truncate max-w-[150px]">
                              {answerSheet.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(e, "sheet")}
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Evaluating... This may take a moment
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Evaluate Paper
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Result View */
          <Card className="glass-card animate-scale-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl font-display">Evaluation Complete</CardTitle>
              <CardDescription>
                The answer sheet has been evaluated and saved successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Result Summary */}
              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="text-lg font-semibold text-foreground">{result.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="text-lg font-semibold text-foreground">{result.subject}</p>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Marks Obtained</p>
                    <p className="text-4xl font-display font-bold text-foreground">
                      {result.obtainedMarks} <span className="text-xl text-muted-foreground">/ {result.totalMarks}</span>
                    </p>
                    <p className="text-lg text-primary font-medium mt-1">{result.percentage}%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="hero" 
                  className="flex-1"
                  onClick={handleDownloadPdf}
                  disabled={!result.pdfReportUrl}
                >
                  <FileText className="h-4 w-4" />
                  Download PDF Report
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate("/history")}>
                  Go to History
                </Button>
              </div>

              <Button variant="ghost" className="w-full" onClick={resetForm}>
                Evaluate Another Paper
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Evaluate;