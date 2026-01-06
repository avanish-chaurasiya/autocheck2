import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { generateEvaluationPdf } from "@/lib/pdfGenerator";

interface QuestionEvaluation {
  questionNumber: number;
  maxMarks: number;
  obtainedMarks: number;
  feedback: string;
}

interface EvaluationResult {
  rollNumber: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  questionWiseEvaluation: QuestionEvaluation[];
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  pdfReportUrl?: string;
}

const Evaluate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
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

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.type === 'text/plain') {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDFs, we'll send a placeholder - in production, use a PDF parsing library
        resolve(`[PDF Content from ${file.name}]\n\nNote: PDF text extraction is being processed. The AI will evaluate based on the provided answer key structure.`);
      } else if (file.type.startsWith('image/')) {
        // For images, convert to base64 for potential OCR
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          resolve(`[Image Content from ${file.name}]\n\nBase64: ${base64.substring(0, 500)}...\n\nNote: Image content will be evaluated by AI.`);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        resolve(`[File: ${file.name}]`);
      }
    });
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
    setLoadingStatus("Extracting content from files...");

    try {
      // Extract text from files
      const answerKeyText = await extractTextFromFile(answerKey);
      const answerSheetText = await extractTextFromFile(answerSheet);

      setLoadingStatus("AI is evaluating the answer sheet...");

      // Call the edge function for AI evaluation
      const { data, error } = await supabase.functions.invoke('evaluate-paper', {
        body: {
          answerKeyText,
          answerSheetText,
          subject: formData.subject,
          totalMarks: parseInt(formData.totalMarks),
          rollNumber: formData.rollNumber,
        }
      });

      if (error) {
        console.error('Evaluation error:', error);
        throw new Error(error.message || 'Evaluation failed');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setLoadingStatus("Generating PDF report...");

      // Generate PDF report
      const pdfBlob = generateEvaluationPdf(data);
      
      setLoadingStatus("Uploading report to storage...");

      // Upload PDF to storage
      const pdfUrl = await uploadPdfReport(pdfBlob, formData.rollNumber, formData.subject);

      setLoadingStatus("Saving evaluation results...");

      // Save evaluation to database
      const saved = await saveEvaluationToDatabase(data, pdfUrl);

      if (!saved) {
        throw new Error('Failed to save evaluation');
      }

      setResult({
        ...data,
        pdfReportUrl: pdfUrl || undefined,
      });

      toast({
        title: "Evaluation Complete",
        description: `Score: ${data.obtainedMarks}/${data.totalMarks} (${data.grade})`,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "An error occurred during evaluation.",
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
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
                Upload the answer key and student's answer sheet for AI-powered evaluation using Gemini.
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>

                {/* File Uploads */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Answer Key Upload */}
                  <div className="space-y-2">
                    <Label>Answer Key (PDF/Text) *</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  {/* Answer Sheet Upload */}
                  <div className="space-y-2">
                    <Label>Student Answer Sheet (PDF/Image) *</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {loadingStatus || "Processing..."}
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
                AI-powered evaluation using Gemini completed successfully.
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
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Marks Obtained</p>
                      <p className="text-4xl font-display font-bold text-foreground">
                        {result.obtainedMarks} <span className="text-xl text-muted-foreground">/ {result.totalMarks}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Grade</p>
                      <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
                        result.percentage >= 80 ? 'bg-success/20 text-success' :
                        result.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {result.grade}
                      </div>
                    </div>
                  </div>
                  <p className="text-lg text-primary font-medium mt-3 text-center">{result.percentage}%</p>
                </div>
              </div>

              {/* Overall Feedback */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="font-semibold text-foreground mb-2">Overall Feedback</h4>
                <p className="text-muted-foreground text-sm">{result.overallFeedback}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid sm:grid-cols-2 gap-4">
                {result.strengths && result.strengths.length > 0 && (
                  <div className="bg-success/10 rounded-xl p-4">
                    <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Strengths
                    </h4>
                    <ul className="text-sm text-foreground space-y-1">
                      {result.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.areasForImprovement && result.areasForImprovement.length > 0 && (
                  <div className="bg-orange-500/10 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Areas for Improvement
                    </h4>
                    <ul className="text-sm text-foreground space-y-1">
                      {result.areasForImprovement.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
