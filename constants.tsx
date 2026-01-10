import { User } from './types';

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

// MENUS removido - sistema de cardápios removido

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