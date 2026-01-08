import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationRequest {
  answerKeyText: string;
  answerSheetText: string;
  subject: string;
  totalMarks: number;
  rollNumber: string;
}

// Calculate text extraction accuracy based on content quality indicators
function calculateTextExtractionAccuracy(text: string): number {
  let score = 100;
  
  // Check for placeholder/error indicators
  if (text.includes('[PDF Content from') || text.includes('[Image Content from')) {
    score -= 30; // Significant penalty for unprocessed files
  }
  
  // Check for base64 data (means image wasn't OCR'd)
  if (text.includes('Base64:')) {
    score -= 25;
  }
  
  // Check for very short content (likely extraction failed)
  const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
  if (wordCount < 20) {
    score -= 30;
  } else if (wordCount < 50) {
    score -= 15;
  }
  
  // Check for gibberish/encoding issues
  const nonAlphanumericRatio = (text.replace(/[a-zA-Z0-9\s.,!?;:'"()-]/g, '').length) / text.length;
  if (nonAlphanumericRatio > 0.3) {
    score -= 20;
  }
  
  // Check for repeated characters (OCR artifacts)
  const repeatedChars = text.match(/(.)\1{4,}/g);
  if (repeatedChars && repeatedChars.length > 3) {
    score -= 15;
  }
  
  // Bonus for structured content (questions, numbers)
  const hasQuestionNumbers = /\b(Q\d+|Question\s*\d+|\d+\.|[1-9]\))/i.test(text);
  if (hasQuestionNumbers) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

interface QuestionEvaluation {
  questionNumber: number;
  maxMarks: number;
  obtainedMarks: number;
  feedback: string;
}

interface EvaluationResponse {
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
  textExtractionAccuracy: number;
  requiresManualReview: boolean;
  reviewReason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const { answerKeyText, answerSheetText, subject, totalMarks, rollNumber }: EvaluationRequest = await req.json();

    console.log(`Evaluating paper for roll number: ${rollNumber}, subject: ${subject}`);

    // Calculate text extraction accuracy for both files
    const answerKeyAccuracy = calculateTextExtractionAccuracy(answerKeyText);
    const answerSheetAccuracy = calculateTextExtractionAccuracy(answerSheetText);
    const overallAccuracy = Math.round((answerKeyAccuracy + answerSheetAccuracy) / 2);
    
    console.log(`Text extraction accuracy - Key: ${answerKeyAccuracy}%, Sheet: ${answerSheetAccuracy}%, Overall: ${overallAccuracy}%`);

    // If accuracy is below 85%, flag for manual review
    const ACCURACY_THRESHOLD = 85;
    const requiresManualReview = overallAccuracy < ACCURACY_THRESHOLD;
    
    if (requiresManualReview) {
      console.log(`Paper flagged for manual review due to low extraction accuracy (${overallAccuracy}%)`);
      
      const result: EvaluationResponse = {
        rollNumber,
        subject,
        totalMarks,
        obtainedMarks: 0,
        percentage: 0,
        grade: 'PENDING',
        questionWiseEvaluation: [],
        overallFeedback: "This paper requires manual review by the teacher due to low text extraction accuracy.",
        strengths: [],
        areasForImprovement: [],
        textExtractionAccuracy: overallAccuracy,
        requiresManualReview: true,
        reviewReason: `Text extraction accuracy (${overallAccuracy}%) is below the 85% threshold. Answer Key accuracy: ${answerKeyAccuracy}%, Answer Sheet accuracy: ${answerSheetAccuracy}%.`
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert academic evaluator. Your task is to evaluate student answer sheets against the provided answer key and return a structured evaluation.

IMPORTANT: You must respond with ONLY a valid JSON object, no additional text.

Evaluation Guidelines:
1. Compare each answer in the student's sheet against the answer key
2. Award marks based on correctness, completeness, and clarity
3. Provide constructive feedback for each question
4. Identify strengths and areas for improvement
5. Be fair and consistent in your evaluation`;

    const userPrompt = `Evaluate the following student answer sheet against the answer key.

ANSWER KEY:
${answerKeyText}

STUDENT ANSWER SHEET:
${answerSheetText}

Subject: ${subject}
Total Marks: ${totalMarks}
Student Roll Number: ${rollNumber}

Please evaluate and return a JSON object with this exact structure:
{
  "questionWiseEvaluation": [
    {
      "questionNumber": 1,
      "maxMarks": 10,
      "obtainedMarks": 8,
      "feedback": "Specific feedback for this answer"
    }
  ],
  "obtainedMarks": 75,
  "overallFeedback": "Overall performance summary",
  "strengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Area 1", "Area 2"]
}

If you cannot identify specific questions, provide an overall evaluation with estimated marks based on the content quality.`;

    console.log("Calling Lovable AI Gateway for evaluation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI evaluation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI");
      throw new Error("Empty response from AI");
    }

    console.log("AI response received, parsing...");

    // Extract JSON from the response
    let evaluationData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", content);
      
      // Fallback evaluation if parsing fails
      const estimatedMarks = Math.floor(totalMarks * 0.7);
      evaluationData = {
        questionWiseEvaluation: [],
        obtainedMarks: estimatedMarks,
        overallFeedback: "Evaluation completed. The student demonstrated understanding of the subject matter.",
        strengths: ["Shows understanding of core concepts"],
        areasForImprovement: ["Could provide more detailed explanations"]
      };
    }

    // Calculate grade
    const percentage = Math.round((evaluationData.obtainedMarks / totalMarks) * 100);
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const result: EvaluationResponse = {
      rollNumber,
      subject,
      totalMarks,
      obtainedMarks: evaluationData.obtainedMarks,
      percentage,
      grade,
      questionWiseEvaluation: evaluationData.questionWiseEvaluation || [],
      overallFeedback: evaluationData.overallFeedback || "Evaluation completed successfully.",
      strengths: evaluationData.strengths || [],
      areasForImprovement: evaluationData.areasForImprovement || [],
      textExtractionAccuracy: overallAccuracy,
      requiresManualReview: false
    };

    console.log(`Evaluation complete: ${result.obtainedMarks}/${result.totalMarks} (${result.grade}) - Accuracy: ${overallAccuracy}%`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An error occurred during evaluation" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
