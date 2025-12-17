-- Add RLS policies for training_reports
ALTER TABLE public.training_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can create reports"
ON public.training_reports
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.training_bookings
  WHERE training_bookings.id = training_reports.booking_id
  AND training_bookings.trainer_id = auth.uid()
));

CREATE POLICY "Participants can view training reports"
ON public.training_reports
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.training_bookings
  WHERE training_bookings.id = training_reports.booking_id
  AND (training_bookings.trainer_id = auth.uid() OR training_bookings.owner_id = auth.uid())
));