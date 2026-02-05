-- Create a table to track credit card paid status per month
CREATE TABLE public.credit_card_monthly_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, credit_card_id, year_month)
);

-- Enable Row Level Security
ALTER TABLE public.credit_card_monthly_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own card status"
ON public.credit_card_monthly_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card status"
ON public.credit_card_monthly_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card status"
ON public.credit_card_monthly_status
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card status"
ON public.credit_card_monthly_status
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_credit_card_monthly_status_updated_at
BEFORE UPDATE ON public.credit_card_monthly_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();