export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hungerRestore?: number;
  thirstRestore?: number;
  alcoholLevel?: number;
  preparationTime?: number; // tempo em minutos
}

export interface FoodOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  location: string;
  items: OrderItem[];
  total_price: number;
  preparation_time: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  ready_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  hungerRestore?: number;
  thirstRestore?: number;
  alcoholLevel?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

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
  money?: number;
  hp?: number;
  maxHp?: number;
  hunger?: number;
  thirst?: number;
  alcohol?: number;
  currentDisease?: string;
  last_spin_at?: string;
  isActiveRP?: boolean;
}

export interface JobApplication {
  id: string;
  user_id: string;
  location: string;
  applicant_name: string;
  applicant_age: number;
  experience: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: any;
}

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
  Personagens = 'Personagens',
  Chat = 'Chat JYP'
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