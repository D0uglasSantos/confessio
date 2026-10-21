-- Lotes de senha de papel aceitam qualquer inteiro de 1 a 500,
-- além dos atalhos pré-definidos na secretaria.

ALTER TABLE public.paper_print_batches
  DROP CONSTRAINT paper_print_batches_count_chk;

ALTER TABLE public.paper_print_batches
  ADD CONSTRAINT paper_print_batches_count_chk CHECK (
    ticket_count >= 1
    AND ticket_count <= 500
  );
