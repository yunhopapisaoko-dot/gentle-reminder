import { Post, User, Comment, MenuItem } from './types';

export interface DiseaseInfo {
  id: string;
  name: string;
  hpImpact: number;
  cureTime: string;
  treatmentCost: number;
  icon: string;
}

export const DISEASE_DETAILS: Record<string, DiseaseInfo> = {
  d1: { id: 'd1', name: 'Febre Mágica', hpImpact: -30, cureTime: '10 min', treatmentCost: 50, icon: 'coronavirus' },
  d2: { id: 'd2', name: 'Maldição do Silêncio', hpImpact: -20, cureTime: '15 min', treatmentCost: 75, icon: 'comments_disabled' },
  d3: { id: 'd3', name: 'Gripe Estelar', hpImpact: -40, cureTime: '5 min', treatmentCost: 120, icon: 'ac_unit' },
  d4: { id: 'd4', name: 'Vírus Neon', hpImpact: -50, cureTime: '20 min', treatmentCost: 200, icon: 'biotech' },
  d5: { id: 'd5', name: 'Amnésia Espiritual', hpImpact: -15, cureTime: '12 min', treatmentCost: 45, icon: 'psychology_alt' },
};

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Tadachi',
  username: 'tadachi_san',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDqcYQqxWTZorSQBeW_nj5j8VdA9ky8r-_aP0OcudmSl_leNqPqFenaQ76HNHiRgkcHw6HCKwjzg5x9FDuNWlcYVgyCqI6zXBhn84kZkZOvaFdCyrFVIgzBgDyIBTOIDYZU7rwI4BevXGRzeV56eu8x2CFVd4ntuPeyST0RgmAnHwz2Us89wdwsT4Hc_cafUk6WT0Cl3poBx4fpPXBFwWQ_FjGPUZZJYKik7cNbcxAqRUDOWK25AX1vEbOG2XBFrtqAJlAE4CiTQ',
  bio: 'Digital artist & Vocaloid enthusiast. Dreaming in purple and violet. 💜✨',
  banner: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000',
  hp: 100,
  maxHp: 100
};

export interface SubLocation {
  name: string;
  icon: string;
  wallpaper: string;
}

export const SUB_LOCATIONS: Record<string, SubLocation[]> = {
  restaurante: [
    { name: 'Reserva VIP', icon: 'stars', wallpaper: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=1000' },
    { name: 'Banheiro Masc.', icon: 'man', wallpaper: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000' },
    { name: 'Banheiro Fem.', icon: 'woman', wallpaper: 'https://images.unsplash.com/photo-1600566752355-35792bedbb5d?q=80&w=1000' },
    { name: 'Cozinha', icon: 'cooking', wallpaper: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000' },
  ],
  padaria: [
    { name: 'Reserva VIP', icon: 'stars', wallpaper: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=1000' },
    { name: 'Banheiro Masc.', icon: 'man', wallpaper: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000' },
    { name: 'Banheiro Fem.', icon: 'woman', wallpaper: 'https://images.unsplash.com/photo-1600566752355-35792bedbb5d?q=80&w=1000' },
    { name: 'Cozinha', icon: 'cooking', wallpaper: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000' },
  ],
  hospital: [
    { name: 'Sala de Cirurgia', icon: 'emergency', wallpaper: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1000' },
    { name: 'Sala 1', icon: 'door_front', wallpaper: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000' },
    { name: 'Sala 2', icon: 'door_front', wallpaper: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000' },
    { name: 'Sala 3', icon: 'door_front', wallpaper: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000' },
  ],
  creche: [
    { name: 'Sala de Aula', icon: 'school', wallpaper: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000' },
    { name: 'Parquinho', icon: 'toys', wallpaper: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=1000' },
  ]
};

export const MENUS: Record<string, MenuItem[]> = {
  padaria: [
    { id: 'p1', category: 'Comidas', name: 'Croissant Amêndoas', description: 'Massa folhada artesanal com creme frangipane.', price: 18.50, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400' },
    { id: 'p2', category: 'Comidas', name: 'Pão Hokkaido', description: 'Pão ultra macio japonês amanteigado.', price: 15.00, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400' },
    { id: 'p6', category: 'Comidas', name: 'Tamago Sando', description: 'Sanduíche de ovo com maionese kewpie.', price: 22.00, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400' },
    { id: 'p3', category: 'Bebidas', name: 'Matcha Neon', description: 'Matcha cerimonial com leite de aveia.', price: 16.00, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=400' },
    { id: 'p7', category: 'Bebidas', name: 'Taro Latte', description: 'Cremoso de taro com pérolas negras.', price: 19.00, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907d3f?q=80&w=400' },
    { id: 'p4', category: 'Alcoólicas', name: 'Miku Beer', description: 'Witbier leve com notas de laranja.', price: 24.00, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=400' },
    { id: 'p5', category: 'Sobremesas', name: 'Sonho Baunilha', description: 'Recheado com favas de baunilha.', price: 12.00, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400' },
    { id: 'p8', category: 'Sobremesas', name: 'Taiyaki Nutella', description: 'Peixinho quente com avelã.', price: 14.00, image: 'https://images.unsplash.com/photo-1590186883177-33989e7c53e8?q=80&w=400' },
  ],
  restaurante: [
    { id: 'r1', category: 'Comidas', name: 'Miku Ramen', description: 'Caldo tonkotsu cremoso 24h e chashu.', price: 48.00, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400' },
    { id: 'r2', category: 'Comidas', name: 'Neon Sushi', description: '12 peças com salmão e trufas.', price: 62.00, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400' },
    { id: 'r7', category: 'Comidas', name: 'Takoyaki', description: '6 bolinhos de polvo com katsuobushi.', price: 34.00, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400' },
    { id: 'r8', category: 'Comidas', name: 'Okonomiyaki', description: 'Panqueca de bacon e repolho.', price: 38.00, image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=400' },
    { id: 'r3', category: 'Bebidas', name: 'Ramune Blue', description: 'Refrigerante clássico japonês.', price: 14.00, image: 'https://images.unsplash.com/photo-1543250609-bc0353982823?q=80&w=400' },
    { id: 'r9', category: 'Bebidas', name: 'Melon Float', description: 'Soda de melão com sorvete.', price: 22.00, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400' },
    { id: 'r4', category: 'Alcoólicas', name: 'Sakura Sake', description: 'Sake premium com pétalas de sakura.', price: 32.00, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400' },
    { id: 'r5', category: 'Alcoólicas', name: 'Cyber Drink', description: 'Gin e violeta com glitter.', price: 38.00, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=400' },
    { id: 'r10', category: 'Alcoólicas', name: 'Whisky High', description: 'Suntory com gelo esculpido.', price: 42.00, image: 'https://images.unsplash.com/photo-1597075091910-dc992183e9ab?q=80&w=400' },
    { id: 'r6', category: 'Sobremesas', name: 'Ichigo Mochi', description: 'Arroz elástico e morango fresco.', price: 18.00, image: 'https://images.unsplash.com/photo-1582760902830-976458564209?q=80&w=400' },
    { id: 'r11', category: 'Sobremesas', name: 'Fruit Parfait', description: 'Chantilly, sorvete e pocky.', price: 28.00, image: 'https://images.unsplash.com/photo-1474978528675-4a50a4508dc3?q=80&w=400' },
  ]
};

const DUMMY_COMMENTS: Comment[] = [
  { id: 'c1', author: { id: 'a2', name: 'Luka', username: 'luka', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAT-yD4LQt4K_tAJAxA8XfjHH8iBAtKw_qsbYG-FjHgddsLmWbykfqY0nlR3XehkmFd9Z5U-auSvRFU5hdA-uAoYv8oX_LV8Xex8gIEUxzHalaw25f7JT1w9I5g2NCUTbgUmfspS6Q0xDbxkUGYyA2F0R425mJPhNilTCzyqKZGtjBAXmB23SR1TELAfpWeufNWTqadJzQAo1y0mGMfrFI5fFiBCifFY9za2uMnvbcFZyE_faxF6SD8FKo7l8v4gooHScFtzFdqQ' }, text: 'Isso ficou incrível! Amei as cores! 😍', timestamp: '1h' },
  { id: 'c2', author: { id: 'a3', name: 'Rin', username: 'rin_orange', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlEmqUd-QHgDfPqRPmJaBsepG8pVM4PCo5KhCETfwVvPXDr0FZ4_4XPZGCTlovWD2an8JLW0HraNOlx2dV8K8uiG2bsbVeQ_2vGjpSCIWd8uHMYvKBXDsQnp2d9KyhCWvZpfc-TXKRECHclYkG20b5AokRB6VxY5EmE7B5LZ5DcJ582ZnfLTDRvXYKgOEp1DF9r_NuHANQNZ57hC1CdRTMCYLVvaKbEmKz5c0lTXxlR5XFkiad7Ja2xMFMdiPFth52aXmS7voJNg' }, text: 'O próximo tem que ser laranja, hein? 😉', timestamp: '30min' }
];

export const ARTISTS: User[] = [
  { 
    id: 'a1', 
    name: 'Miku Art', 
    username: 'miku_fan_art',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDqcYQqxWTZorSQBeW_nj5j8VdA9ky8r-_aP0OcudmSl_leNqPqFenaQ76HNHiRgkcHw6HCKwjzg5x9FDuNWlcYVgyCqI6zXBhn84kZkZOvaFdCyrFVIgzBgDyIBTOIDYZU7rwI4BevXGRzeV56eu8x2CFVd4ntuPeyST0RgmAnHwz2Us89wdwsT4Hc_cafUk6WT0Cl3poBx4fpPXBFwWQ_FjGPUZZJYKik7cNbcxAqRUDOWK25AX1vEbOG2XBFrtqAJlAE4CiTQ', 
    bio: 'Official Miku Fanart hub. Sharing the love for the number one princess!',
    banner: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1000'
  },
  { 
    id: 'a2', 
    name: 'Luka Chan', 
    username: 'luka_pink',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAT-yD4LQt4K_tAJAxA8XfjHH8iBAtKw_qsbYG-FjHgddsLmWbykfqY0nlR3XehkmFd9Z5U-auSvRFU5hdA-uAoYv8oX_LV8Xex8gIEUxzHalaw25f7JT1w9I5g2NCUTbgUmfspS6Q0xDbxkUGYyA2F0R425mJPhNilTCzyqKZGtjBAXmB23SR1TELAfpWeufNWTqadJzQAo1y0mGMfrFI5fFiBCifFY9za2uMnvbcFZyE_faxF6SD8FKo7l8v4gooHScFtzFdqQ',
    bio: 'Pink hair, don\'t care. Tuning the best Megurine Luka tracks.',
    banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000'
  }
];

export const FEATURE_POST: Post = {
  id: 'p1',
  title: 'Happy Miku day!!',
  excerpt: 'Hihi! My name is Tadachi and this is my first entry for the Miku birthday event! Estive trabalhando nisso por semanas.',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_gRiZR8ymE4KwE7OyOOcHnflDTV84gYgOiFWc-zQ29bamm6iMr3Y74Rp9NVNkC7xQfTcvtWkZ0ceMVl0uHBB16cpORVvgPfqMT8jEg_eZQ8XvwhlHchBTTqGBL6jNUvhbOBXt3CnbDhTf8NPXOkXCLhD0ezjCb8RHB2Z6IOXAOP3W8XJiZDaZ7Si0T9W9UrN4_IzQFexaZzz8rX5jSdTyoaqX689MBW01N2fhvkWZb576HylDLTrk9KLQxvVYItr0A3gPRRMsVw',
  author: CURRENT_USER,
  timestamp: '3 mins ago',
  likes: '22.2k',
  comments: DUMMY_COMMENTS
};

export const GRID_POSTS: Post[] = [
  {
    id: 'p_text_1',
    title: 'Bom dia pessoal!',
    excerpt: 'Acabei de chegar no restaurante neon e a música está incrível hoje. Alguém por aqui querendo fazer um RP de cafeteria? ^_^',
    author: CURRENT_USER,
    timestamp: '10 mins ago',
    likes: '12',
    comments: []
  },
  {
    id: 'p2',
    title: 'Strawberry Dreams',
    excerpt: 'Uma exploração de tons pastéis e doces.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAT-yD4LQt4K_tAJAxA8XfjHH8iBAtKw_qsbYG-FjHgddsLmWbykfqY0nlR3XehkmFd9Z5U-auSvRFU5hdA-uAoYv8oX_LV8Xex8gIEUxzHalaw25f7JT1w9I5g2NCUTbgUmfspS6Q0xDbxkUGYyA2F0R425mJPhNilTCzyqKZGtjBAXmB23SR1TELAfpWeufNWTqadJzQAo1y0mGMfrFI5fFiBCifFY9za2uMnvbcFZyE_faxF6SD8FKo7l8v4gooHScFtzFdqQ',
    author: CURRENT_USER,
    timestamp: '1h ago',
    likes: '1.2k',
    comments: []
  },
  {
    id: 'p_text_2',
    title: 'Pensamentos sobre Vocaloid',
    excerpt: 'Sabe, às vezes eu paro para pensar como a tecnologia mudou a forma como consumimos música. Vocaloid não é apenas um software, é um movimento cultural global. Qual a sua opinião sobre isso? #Miku #Vocaloid',
    author: CURRENT_USER,
    timestamp: '2h ago',
    likes: '450',
    comments: DUMMY_COMMENTS
  },
  {
    id: 'p3',
    title: 'Cherry Blossom Tea',
    excerpt: 'Chá e flores de cerejeira.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlEmqUd-QHgDfPqRPmJaBsepG8pVM4PCo5KhCETfwVvPXDr0FZ4_4XPZGCTlovWD2an8JLW0HraNOlx2dV8K8uiG2bsbVeQ_2vGjpSCIWd8uHMYvKBXDsQnp2d9KyhCWvZpfc-TXKRECHclYkG20b5AokRB6VxY5EmE7B5LZ5DcJ582ZnfLTDRvXYKgOEp1DF9r_NuHANQNZ57hC1CdRTMCYLVvaKbEmKz5c0lTXxlR5XFkiad7Ja2xMFMdiPFth52aXmS7voJNg',
    author: CURRENT_USER,
    timestamp: '3h ago',
    likes: '3.4k'
  },
  {
    id: 'p4',
    title: 'Neon Night',
    excerpt: 'Noites futuristas.',
    imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400',
    author: CURRENT_USER,
    timestamp: '5h ago',
    likes: '800'
  }
];

export const PINNED_EVENTS = [
  "Miku birthday | Official Event",
  "MD Theme Poll | Theme Event"
];