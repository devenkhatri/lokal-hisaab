alter table public.transactions
  add column commission numeric(12,2) not null default 0;
