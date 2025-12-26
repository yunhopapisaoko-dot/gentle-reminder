export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
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
  hp?: number;
  maxHp?: number;
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