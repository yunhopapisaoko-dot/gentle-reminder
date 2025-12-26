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
  race?: 'Draeven' | 'Sylven' | 'Lunari';
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
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  age: number;
  relationship: string;
  gender: string;
  sexuality: string;
  origin: string;
  appearance_name: string;
  group_name: string;
  image_url: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  location: string;
  name: string;
  age: string;
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
}

export enum TabType {
  Destaque = 'Destaque',
  Feed = 'Feed',
  Global = 'Global',
  Locais = 'Locais',
  Personagens = 'Personagens',
  Chat = 'Chat Miku'
}