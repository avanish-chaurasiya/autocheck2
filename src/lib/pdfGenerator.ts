import jsPDF from 'jspdf';

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
}

export const generateEvaluationPdf = (evaluation: EvaluationResult): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 7): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper to check and add new page if needed
  const checkNewPage = (requiredSpace: number = 30) => {
    if (yPos > 270 - requiredSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title
  doc.setFillColor(59, 130, 246); // Blue header
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUATION REPORT', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, 35, { align: 'center' });

  yPos = 55;

  // Student Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', margin + 5, yPos + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Roll Number: ${evaluation.rollNumber}`, margin + 5, yPos + 20);
  doc.text(`Subject: ${evaluation.subject}`, margin + 5, yPos + 28);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, yPos + 20);

  yPos += 45;

  // Results Summary Box
  doc.setFillColor(220, 252, 231); // Light green
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'F');
  
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTS SUMMARY', margin + 5, yPos + 10);
  
  // Marks box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 10, yPos + 15, 50, 25, 2, 2, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(20);
  doc.text(`${evaluation.obtainedMarks}`, margin + 35, yPos + 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`/ ${evaluation.totalMarks}`, margin + 35, yPos + 37, { align: 'center' });
  
  // Percentage box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 70, yPos + 15, 40, 25, 2, 2, 'F');
  doc.setFontSize(16);
  doc.text(`${evaluation.percentage}%`, margin + 90, yPos + 32, { align: 'center' });
  
  // Grade box
  const gradeColor = evaluation.percentage >= 80 ? [22, 163, 74] : 
                     evaluation.percentage >= 60 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.roundedRect(margin + 120, yPos + 15, 35, 25, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(evaluation.grade, margin + 137.5, yPos + 32, { align: 'center' });

  yPos += 55;

  // Question-wise Evaluation
  if (evaluation.questionWiseEvaluation && evaluation.questionWiseEvaluation.length > 0) {
    checkNewPage(50);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QUESTION-WISE EVALUATION', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Q.No', margin + 5, yPos + 6);
    doc.text('Max', margin + 25, yPos + 6);
    doc.text('Obtained', margin + 45, yPos + 6);
    doc.text('Feedback', margin + 75, yPos + 6);
    yPos += 10;

    evaluation.questionWiseEvaluation.forEach((q, index) => {
      checkNewPage(20);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 12, 'F');
      }
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.text(`${q.questionNumber}`, margin + 5, yPos + 5);
      doc.text(`${q.maxMarks}`, margin + 25, yPos + 5);
      doc.text(`${q.obtainedMarks}`, margin + 50, yPos + 5);
      
      // Truncate feedback if too long
      const feedbackWidth = pageWidth - margin - 80;
      const truncatedFeedback = q.feedback.length > 60 ? q.feedback.substring(0, 57) + '...' : q.feedback;
      doc.setFontSize(8);
      doc.text(truncatedFeedback, margin + 75, yPos + 5);
      doc.setFontSize(9);
      
      yPos += 12;
    });
    
    yPos += 5;
  }

  // Overall Feedback
  checkNewPage(40);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('OVERALL FEEDBACK', margin, yPos);
  yPos += 8;
  
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(113, 63, 18);
  yPos = addWrappedText(evaluation.overallFeedback, margin + 5, yPos + 8, pageWidth - 2 * margin - 10);
  yPos += 15;

  // Strengths
  if (evaluation.strengths && evaluation.strengths.length > 0) {
    checkNewPage(30);
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ STRENGTHS', margin, yPos);
    yPos += 7;
    
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    evaluation.strengths.forEach(strength => {
      checkNewPage(10);
      doc.text(`• ${strength}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // Areas for Improvement
  if (evaluation.areasForImprovement && evaluation.areasForImprovement.length > 0) {
    checkNewPage(30);
    doc.setTextColor(234, 88, 12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('△ AREAS FOR IMPROVEMENT', margin, yPos);
    yPos += 7;
    
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    evaluation.areasForImprovement.forEach(area => {
      checkNewPage(10);
      doc.text(`• ${area}`, margin + 5, yPos);
      yPos += 6;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 285, pageWidth, 12, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('AI Paper Evaluation System - Confidential Academic Document', pageWidth / 2, 291, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 291, { align: 'right' });
  }

  return doc.output('blob');
};
