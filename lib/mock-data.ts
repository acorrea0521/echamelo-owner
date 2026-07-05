// Datos simulados temporales para el andamiaje del sistema de diseño.
// Se reemplazan por consultas reales a Supabase en la fase de Listados y transmisiones.

export type MockCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type MockStreamer = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isLive: boolean;
  followersCount: number;
};

export type MockStreamCard = {
  id: string;
  title: string;
  thumbnailUrl: string;
  isLive: boolean;
  viewerCount: number;
  seller: MockStreamer;
};

export const mockCategories: MockCategory[] = [
  { id: "cat-moda", name: "Moda", slug: "moda", icon: "shirt" },
  { id: "cat-joyeria", name: "Joyería", slug: "joyeria", icon: "gem" },
  { id: "cat-tecnologia", name: "Tecnología", slug: "tecnologia", icon: "smartphone" },
  { id: "cat-artesanias", name: "Artesanías", slug: "artesanias", icon: "flower-2" },
  { id: "cat-gaming", name: "Gaming", slug: "gaming", icon: "gamepad-2" },
];

export const mockStoryStreamers: MockStreamer[] = [
  { id: "u1", username: "jenyper", displayName: "Jenyper", avatarUrl: "", isLive: true, followersCount: 12000 },
  { id: "u2", username: "alokalok", displayName: "Alok alok", avatarUrl: "", isLive: true, followersCount: 8400 },
  { id: "u3", username: "suhon", displayName: "Suhon", avatarUrl: "", isLive: false, followersCount: 5200 },
  { id: "u4", username: "musang", displayName: "Musang", avatarUrl: "", isLive: true, followersCount: 15300 },
  { id: "u5", username: "tokdal", displayName: "Tok Dal", avatarUrl: "", isLive: false, followersCount: 3100 },
];

export type MockChatMessage = {
  id: string;
  sender: string;
  body: string;
};

export const mockChatMessages: MockChatMessage[] = [
  { id: "m1", sender: "Aloxx.GG", body: "¡Buen juego!" },
  { id: "m2", sender: "Bocil Rames", body: "¡Dale duro Alok! 🎉" },
  { id: "m3", sender: "Randy Rangers", body: "¡No olviden dar like y compartir!" },
];

export const mockCurrentListing = {
  id: "l1",
  title: "Tenis vintage - Air Max 97",
  currentBidCents: 45000,
  minNextBidCents: 49500,
  secondsRemaining: 27,
};

export const mockStreams: MockStreamCard[] = [
  {
    id: "s1",
    title: "Tenis vintage en subasta",
    thumbnailUrl: "",
    isLive: true,
    viewerCount: 1200,
    seller: { id: "u6", username: "randyrangers", displayName: "Randy Rangers", avatarUrl: "", isLive: true, followersCount: 159000 },
  },
  {
    id: "s2",
    title: "Consolas retro en subasta",
    thumbnailUrl: "",
    isLive: true,
    viewerCount: 640,
    seller: { id: "u7", username: "aurakirana", displayName: "Aura Kirana", avatarUrl: "", isLive: true, followersCount: 132000 },
  },
  {
    id: "s3",
    title: "Caja misteriosa de cartas",
    thumbnailUrl: "",
    isLive: true,
    viewerCount: 2300,
    seller: { id: "u8", username: "boccilrames", displayName: "Bocil Rames", avatarUrl: "", isLive: true, followersCount: 88000 },
  },
  {
    id: "s4",
    title: "Noche de joyería artesanal",
    thumbnailUrl: "",
    isLive: false,
    viewerCount: 0,
    seller: { id: "u9", username: "aloxgg", displayName: "Alox.GG", avatarUrl: "", isLive: false, followersCount: 41000 },
  },
];
