// Pool of simulated bidder display names, per project_echamelo_prototype_reference
// (the reference prototype used a 96-name pool of Spanish handles). Bots are
// purely cosmetic — see place_bot_bid() in Postgres: they never touch the
// `bids` ledger or charge real money.
export const BOT_NAME_POOL = [
  "PakiExpress99", "MariCompras_MX", "JuanElRegio", "LupitaShops", "CarlosDeals",
  "AnaBargains", "PedroVIP", "SofiaOutlet", "DiegoRemata", "ValeCompra",
  "FerCazaOfertas", "GabyEnVivo", "LuisSubastas", "MoniShopper", "OscarRifas",
  "PaolaPuja", "RicardoMX", "SaraOfertas", "TonyDeals99", "UlisesCompra",
  "VeroShops", "XimenaVIP", "YolandaMX", "ZaidCompras", "AdrianRemata",
  "BeatrizPuja", "CesarOutlet", "DanielaMX", "EduardoShops", "FabiolaVIP",
  "GerardoDeals", "HildaCompra", "IvanSubasta", "JazminMX", "KarlaOfertas",
  "LeonardoPuja", "MayraShops", "NicolasVIP", "OliviaMX", "PabloRemata",
  "QuetzalCompra", "RaulOutlet", "SusanaDeals", "TomasMX", "UrielPuja",
  "VictoriaShops", "WendyVIP", "XavierMX", "YaninaCompra", "ZoilaOfertas",
  "AlexPuja_MX", "BrendaDeals", "ChuyOutlet", "DoloresVIP", "EmilioShops",
  "FridaCompra", "GonzaloMX", "HectorPuja", "IsabelDeals", "JavierVIP",
  "KenyaShops", "LorenaMX", "MiguelOutlet", "NoeCompra", "OrlandoPuja",
  "PatyDeals", "QuincyMX", "RobertoVIP", "SelenaShops", "ToñoCompra",
  "UgoOutlet", "ViriPuja", "WalterMX", "XochitlDeals", "YairVIP",
  "ZuleimaShops", "AbrilCompra", "BenjaminMX", "CandyPuja", "DulceOutlet",
  "EstebanDeals", "FloridaMX", "GerardoVIP", "HugoShops", "IreneCompra",
  "JorgePuja", "KarinaOutlet", "LalitoDeals", "MartaMX", "NestorVIP",
  "OmarShops", "PriscilaCompra", "QuiqueMX", "RositaPuja", "SamuelOutlet",
  "TereDeals", "UrbanoVIP", "ViolaShops",
] as const;

export const BOT_CHAT_PHRASES = [
  "¡Yo lo quiero!",
  "Se ve increíble 😍",
  "Voy a pujar más alto",
  "Necesito eso ya",
  "Qué buena oferta",
  "No me lo van a ganar",
  "Justo lo que buscaba",
  "Rapidísimo, voy",
  "Está buenísimo el precio",
  "Aquí sigo pujando",
] as const;

export function randomBotName(exclude?: string | null): string {
  const pool = exclude ? BOT_NAME_POOL.filter((n) => n !== exclude) : BOT_NAME_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomBotPhrase(): string {
  return BOT_CHAT_PHRASES[Math.floor(Math.random() * BOT_CHAT_PHRASES.length)];
}
