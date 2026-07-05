-- Tracks whether a buyer has a valid saved payment method on file.
-- Populated once they complete the payment-card step at signup (see
-- app/api/stripe/save-payment-method/route.ts). Presence of this column
-- is the gate for "can this buyer place a bid" (enforced in the bidding
-- engine, built in a later phase).
alter table public.profiles
  add column stripe_payment_method_id text;
