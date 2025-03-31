-- Adiciona a coluna status na tabela eventos_financeiros
ALTER TABLE eventos_financeiros
ADD COLUMN status text CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Cancelado'));

-- Atualiza os registros existentes com base nas regras de negócio
UPDATE eventos_financeiros
SET status = CASE
    WHEN data_pagamento < CURRENT_DATE AND nota_fiscal_url IS NULL THEN 'Atrasado'
    WHEN nota_fiscal_url IS NOT NULL THEN 'Pago'
    ELSE 'Pendente'
END; 