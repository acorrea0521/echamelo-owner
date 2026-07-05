-- Reusable default shipping address for buyers, shown/edited from
-- /account/payment (see project's "Payments & Shipping" account hub).
alter table public.profiles add column default_shipping_address jsonb;
