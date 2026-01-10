// Tipos removidos: MenuItem, FoodOrder, OrderItem, CartItem (sistema de cardápio removido)

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  race?: 'Draeven' | 'Sylven' | 'Lunari' | 'draeven' | 'sylven' | 'lunari';
  bio?: string;
  banner?: string;
  posts?: Post[];
  isLeader?: boolean;
  isActiveRP?: boolean;
}

// Interface JobApplication removida (sistema de ficha de trabalho removido)

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  videoUrl?: string;
  author: User;
  timestamp: string;
  likes: string;
  comments?: Comment[];
  isLiked?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  author?: User;
  timestamp?: string;
  isSystemMessage?: boolean;
}

export enum TabType {
  Destaque = 'Destaque',
  Feed = 'Feed',
  Global = 'Global',
  Locais = 'Locais',
  Personagens = 'Personagens'
}

export interface VIPReservation {
  id: string;
  location: string;
  reserver_id: string;
  reserver_name: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  expires_at?: string;
  created_at: string;
  guests: VIPGuest[];
}

export interface VIPGuest {
  id: string;
  reservation_id: string;
  user_id: string;
  user_name: string;
}