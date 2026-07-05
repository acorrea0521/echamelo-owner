insert into categories (name, slug, icon, sort_order) values
  ('Ropa Vintage / Paca', 'ropa-vintage', 'shirt', 5),
  ('Sneakers', 'sneakers', 'footprints', 6),
  ('TCG / Pokémon', 'tcg-pokemon', 'layers', 7),
  ('Coleccionables', 'coleccionables', 'star', 8),
  ('Maquillaje', 'maquillaje', 'sparkles', 9)
on conflict (slug) do nothing;
