import { User, MenuItem } from './types';

// Wallpapers imports
import hospitalEntrance from './src/assets/wallpapers/hospital-entrance.jpg';
import hospitalRoom from './src/assets/wallpapers/hospital-room.jpg';
import hospitalSurgery from './src/assets/wallpapers/hospital-surgery.jpg';
import crecheEntrance from './src/assets/wallpapers/creche-entrance.jpg';
import crecheClassroom from './src/assets/wallpapers/creche-classroom.jpg';
import crechePlayground from './src/assets/wallpapers/creche-playground.jpg';
import restauranteMain from './src/assets/wallpapers/restaurante-main.jpg';
import vipRoom from './src/assets/wallpapers/vip-room.jpg';
import kitchen from './src/assets/wallpapers/kitchen.jpg';
import bathroom from './src/assets/wallpapers/bathroom.jpg';
import padariaMain from './src/assets/wallpapers/padaria-main.jpg';
import pousadaEntrance from './src/assets/wallpapers/pousada-entrance.jpg';
import pousadaDormitory from './src/assets/wallpapers/pousada-dormitory.jpg';
import pousadaBackyard from './src/assets/wallpapers/pousada-backyard.jpg';
import pousadaKitchen from './src/assets/wallpapers/pousada-kitchen.jpg';
import farmaciaMain from './src/assets/wallpapers/farmacia-main.jpg';
import farmaciaCounter from './src/assets/wallpapers/farmacia-counter.jpg';
import farmaciaStorage from './src/assets/wallpapers/farmacia-storage.jpg';
import supermercadoMain from './src/assets/wallpapers/supermercado-main.jpg';

export interface DiseaseInfo {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  hpImpact: number;
  cureTime: string;
  treatmentCost: number;
  icon: string;
}

export const DISEASE_DETAILS: Record<string, DiseaseInfo> = {
  d1: { 
    id: 'd1', 
    name: 'Febre Mágica', 
    description: 'Uma febre misteriosa que queima com energia arcana.', 
    symptoms: ['Calafrios', 'Suor intenso', 'Visões arcanas', 'Pele quente'],
    hpImpact: -30, 
    cureTime: '10 min', 
    treatmentCost: 50, 
    icon: 'coronavirus' 
  },
  d2: { 
    id: 'd2', 
    name: 'Maldição do Silêncio', 
    description: 'Sua voz foi selada por forças sombrias.', 
    symptoms: ['Rouquidão', 'Garganta apertada', 'Sussurros involuntários', 'Dificuldade de falar'],
    hpImpact: -20, 
    cureTime: '15 min', 
    treatmentCost: 75, 
    icon: 'comments_disabled' 
  },
  d3: { 
    id: 'd3', 
    name: 'Gripe Estelar', 
    description: 'Partículas cósmicas infectaram seu sistema.', 
    symptoms: ['Espirros brilhantes', 'Nariz congestionado', 'Corpo dolorido', 'Fadiga extrema'],
    hpImpact: -40, 
    cureTime: '5 min', 
    treatmentCost: 120, 
    icon: 'ac_unit' 
  },
  d4: { 
    id: 'd4', 
    name: 'Vírus Neon', 
    description: 'Um vírus digital que afeta corpo e mente.', 
    symptoms: ['Glitches visuais', 'Zumbido nos ouvidos', 'Dormência', 'Confusão mental'],
    hpImpact: -50, 
    cureTime: '20 min', 
    treatmentCost: 200, 
    icon: 'biotech' 
  },
  d5: { 
    id: 'd5', 
    name: 'Amnésia Espiritual', 
    description: 'Fragmentos da sua memória estão se perdendo.', 
    symptoms: ['Lapsos de memória', 'Déjà vu constante', 'Esquecimento', 'Sonhos fragmentados'],
    hpImpact: -15, 
    cureTime: '12 min', 
    treatmentCost: 45, 
    icon: 'psychology_alt' 
  },
};

// CURRENT_USER removido - usar o usuário autenticado do Supabase

export interface SubLocation {
  name: string;
  icon: string;
  wallpaper: string;
  restricted?: boolean; // Se verdadeiro, apenas funcionários ou autorizados entram
}

export const SUB_LOCATIONS: Record<string, SubLocation[]> = {
  restaurante: [
    { name: 'Reserva VIP', icon: 'stars', wallpaper: vipRoom },
    { name: 'Banheiro Masc.', icon: 'man', wallpaper: bathroom },
    { name: 'Banheiro Fem.', icon: 'woman', wallpaper: bathroom },
    { name: 'Cozinha', icon: 'cooking', wallpaper: kitchen, restricted: true },
  ],
  padaria: [
    { name: 'Reserva VIP', icon: 'stars', wallpaper: vipRoom },
    { name: 'Banheiro Masc.', icon: 'man', wallpaper: bathroom },
    { name: 'Banheiro Fem.', icon: 'woman', wallpaper: bathroom },
    { name: 'Cozinha', icon: 'cooking', wallpaper: kitchen, restricted: true },
  ],
  hospital: [
    { name: 'Sala de Cirurgia', icon: 'emergency', wallpaper: hospitalSurgery, restricted: true },
    { name: 'Sala 1', icon: 'door_front', wallpaper: hospitalRoom, restricted: true },
    { name: 'Sala 2', icon: 'door_front', wallpaper: hospitalRoom, restricted: true },
    { name: 'Sala 3', icon: 'door_front', wallpaper: hospitalRoom, restricted: true },
  ],
  creche: [
    { name: 'Sala de Aula', icon: 'school', wallpaper: crecheClassroom, restricted: true },
    { name: 'Parquinho', icon: 'toys', wallpaper: crechePlayground, restricted: true },
  ],
  pousada: [
    { name: 'Entrada', icon: 'door_front', wallpaper: pousadaEntrance },
    { name: 'Dormitório', icon: 'bed', wallpaper: pousadaDormitory },
    { name: 'Quintal', icon: 'park', wallpaper: pousadaBackyard },
    { name: 'Cozinha', icon: 'cooking', wallpaper: pousadaKitchen },
  ],
  farmacia: [
    { name: 'Balcão', icon: 'storefront', wallpaper: farmaciaCounter },
    { name: 'Estoque', icon: 'inventory', wallpaper: farmaciaStorage, restricted: true },
  ],
  supermercado: [
    { name: 'Corredor Principal', icon: 'storefront', wallpaper: supermercadoMain },
  ],
  praia: []
};

export const MENUS: Record<string, MenuItem[]> = {
  padaria: [
    { id: 'p1', category: 'Comidas', name: 'Croissant Amêndoas', description: 'Massa folhada artesanal com creme frangipane.', price: 18.50, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400', hungerRestore: 15, preparationTime: 3 },
    { id: 'p2', category: 'Comidas', name: 'Pão Hokkaido', description: 'Pão ultra macio japonês amanteigado.', price: 15.00, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400', hungerRestore: 20, preparationTime: 2 },
    { id: 'p6', category: 'Comidas', name: 'Tamago Sando', description: 'Sanduíche de ovo com maionese kewpie.', price: 22.00, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400', hungerRestore: 25, preparationTime: 5 },
    { id: 'p3', category: 'Bebidas', name: 'Matcha Neon', description: 'Matcha cerimonial com leite de aveia.', price: 16.00, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=400', thirstRestore: 25, preparationTime: 2 },
    { id: 'p7', category: 'Bebidas', name: 'Taro Latte', description: 'Cremoso de taro com pérolas negras.', price: 19.00, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907d3f?q=80&w=400', thirstRestore: 30, preparationTime: 4 },
    { id: 'p4', category: 'Alcoólicas', name: 'Miku Beer', description: 'Witbier leve com notas de laranja.', price: 24.00, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=400', thirstRestore: 10, alcoholLevel: 15, preparationTime: 1 },
    { id: 'p5', category: 'Sobremesas', name: 'Sonho Baunilha', description: 'Recheado com favas de baunilha.', price: 12.00, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400', hungerRestore: 10, preparationTime: 2 },
    { id: 'p8', category: 'Sobremesas', name: 'Taiyaki Nutella', description: 'Peixinho quente com avelã.', price: 14.00, image: 'https://images.unsplash.com/photo-1590186883177-33989e7c53e8?q=80&w=400', hungerRestore: 12, preparationTime: 4 },
  ],
  restaurante: [
    { id: 'r1', category: 'Comidas', name: 'Miku Ramen', description: 'Caldo tonkotsu cremoso 24h e chashu.', price: 48.00, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400', hungerRestore: 45, preparationTime: 12 },
    { id: 'r2', category: 'Comidas', name: 'Neon Sushi', description: '12 peças com salmão e trufas.', price: 62.00, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400', hungerRestore: 35, preparationTime: 15 },
    { id: 'r7', category: 'Comidas', name: 'Takoyaki', description: '6 bolinhos de polvo com katsuobushi.', price: 34.00, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400', hungerRestore: 20, preparationTime: 8 },
    { id: 'r8', category: 'Comidas', name: 'Okonomiyaki', description: 'Panqueca de bacon e repolho.', price: 38.00, image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=400', hungerRestore: 30, preparationTime: 10 },
    { id: 'r3', category: 'Bebidas', name: 'Ramune Blue', description: 'Refrigerante clássico japonês.', price: 14.00, image: 'https://images.unsplash.com/photo-1543250609-bc0353982823?q=80&w=400', thirstRestore: 25, preparationTime: 1 },
    { id: 'r9', category: 'Bebidas', name: 'Melon Float', description: 'Soda de melão com sorvete.', price: 22.00, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400', thirstRestore: 35, preparationTime: 3 },
    { id: 'r4', category: 'Alcoólicas', name: 'Sakura Sake', description: 'Sake premium com pétalas de sakura.', price: 32.00, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400', thirstRestore: 15, alcoholLevel: 25, preparationTime: 1 },
    { id: 'r5', category: 'Alcoólicas', name: 'Cyber Drink', description: 'Gin e violeta com glitter.', price: 38.00, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=400', thirstRestore: 20, alcoholLevel: 35, preparationTime: 5 },
    { id: 'r10', category: 'Alcoólicas', name: 'Whisky High', description: 'Suntory com gelo esculpido.', price: 42.00, image: 'https://images.unsplash.com/photo-1597075091910-dc992183e9ab?q=80&w=400', thirstRestore: 10, alcoholLevel: 45, preparationTime: 2 },
    { id: 'r6', category: 'Sobremesas', name: 'Ichigo Mochi', description: 'Arroz elástico e morango fresco.', price: 18.00, image: 'https://images.unsplash.com/photo-1582760902830-976458564209?q=80&w=400', hungerRestore: 15, preparationTime: 3 },
    { id: 'r11', category: 'Sobremesas', name: 'Fruit Parfait', description: 'Chantilly, sorvete e pocky.', price: 28.00, image: 'https://images.unsplash.com/photo-1474978528675-4a50a4508dc3?q=80&w=400', hungerRestore: 20, preparationTime: 5 },
  ]
};

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

export const PINNED_EVENTS = [
  "Miku birthday | Official Event",
  "MD Theme Poll | Theme Event"
];