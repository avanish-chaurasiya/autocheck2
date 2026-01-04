-- Create evaluations table for storing student answer sheet evaluations
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_roll_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_marks NUMERIC NOT NULL DEFAULT 0,
  max_marks NUMERIC NOT NULL DEFAULT 100,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answer_sheet_url TEXT,
  pdf_report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher access (users can only see their own evaluations)
CREATE POLICY "Teachers can view their own evaluations" 
ON public.evaluations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can create their own evaluations" 
ON public.evaluations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own evaluations" 
ON public.evaluations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can delete their own evaluations" 
ON public.evaluations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();