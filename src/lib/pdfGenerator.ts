import jsPDF from 'jspdf';

interface QuestionEvaluation {
  questionNumber: number;
  questionText: string;
  studentAnswer: string;
  expectedAnswer: string;
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
    evaluation.questionWiseEvaluation.forEach((q, index) => {
      checkNewPage(80);
      
      // Question header with marks
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${q.questionNumber}`, margin + 5, yPos + 8);
      
      // Marks badge
      const marksText = `${q.obtainedMarks} / ${q.maxMarks}`;
      const marksColor = q.obtainedMarks >= q.maxMarks * 0.8 ? [22, 163, 74] : 
                         q.obtainedMarks >= q.maxMarks * 0.5 ? [234, 179, 8] : [239, 68, 68];
      doc.setFillColor(marksColor[0], marksColor[1], marksColor[2]);
      doc.roundedRect(pageWidth - margin - 35, yPos + 2, 30, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.text(marksText, pageWidth - margin - 20, yPos + 7.5, { align: 'center' });
      yPos += 16;
      
      // Question Text
      if (q.questionText) {
        checkNewPage(25);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 1, 1, 'F');
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('QUESTION:', margin + 3, yPos + 4.5);
        yPos += 8;
        
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPos = addWrappedText(q.questionText, margin + 3, yPos, pageWidth - 2 * margin - 6);
        yPos += 4;
      }
      
      // Expected Answer
      if (q.expectedAnswer) {
        checkNewPage(25);
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 1, 1, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('EXPECTED ANSWER:', margin + 3, yPos + 4.5);
        yPos += 8;
        
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(q.expectedAnswer, margin + 3, yPos, pageWidth - 2 * margin - 6, 5);
        yPos += 4;
      }
      
      // Student Answer
      if (q.studentAnswer) {
        checkNewPage(25);
        doc.setFillColor(254, 249, 195);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 1, 1, 'F');
        doc.setTextColor(113, 63, 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('STUDENT ANSWER:', margin + 3, yPos + 4.5);
        yPos += 8;
        
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(q.studentAnswer, margin + 3, yPos, pageWidth - 2 * margin - 6, 5);
        yPos += 4;
      }
      
      // Feedback/Review
      if (q.feedback) {
        checkNewPage(25);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 1, 1, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('REVIEW:', margin + 3, yPos + 4.5);
        yPos += 8;
        
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(q.feedback, margin + 3, yPos, pageWidth - 2 * margin - 6, 5);
        yPos += 8;
      }
      
      // Add separator between questions
      if (index < evaluation.questionWiseEvaluation.length - 1) {
        doc.setDrawColor(226, 232, 240);
        doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos);
        yPos += 8;
      }
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
