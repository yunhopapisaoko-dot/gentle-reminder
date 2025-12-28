// Types for pharmacy system

export interface PharmacyItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'pregnancy_test' | 'scratch_card' | 'contraceptive' | 'medicine';
  icon: string;
  image?: string; // Image URL for the item
  restrictedTo?: 'lunari'; // Only Lunari can use pregnancy tests
  duration?: number; // Duration in days for contraceptives
}

export interface PharmacyOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  item_type: string;
  item_name: string;
  item_price: number;
  quantity: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface PregnancyTest {
  id: string;
  user_id: string;
  result: 'positive' | 'negative';
  used_at: string;
  expires_at: string;
  announced: boolean;
}

export interface Pregnancy {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  baby_gender: 'male' | 'female';
  announced: boolean;
  delivered: boolean;
  created_from_test_id: string | null;
}

export interface ScratchCard {
  id: string;
  user_id: string;
  slots: ScratchSlot[];
  prize_type: 'money' | 'food_voucher' | 'nothing' | null;
  prize_amount: number;
  won: boolean;
  scratched_at: string;
}

export interface ScratchSlot {
  symbol: string;
  revealed: boolean;
}

export interface ContraceptiveEffect {
  id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
}

export interface BabyDelivery {
  id: string;
  mother_id: string;
  mother_name: string;
  baby_gender: 'male' | 'female';
  pregnancy_id: string | null;
  status: 'pending' | 'processed';
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

// Import pharmacy item images
import pregnancyTestImg from '@/assets/pharmacy/pregnancy-test.png';
import scratchCardImg from '@/assets/pharmacy/scratch-card.png';
import contraceptiveImg from '@/assets/pharmacy/contraceptive.png';
import medicineColdImg from '@/assets/pharmacy/medicine-cold.png';
import medicineFeverImg from '@/assets/pharmacy/medicine-fever.png';
import medicinePainImg from '@/assets/pharmacy/medicine-pain.png';

// Pharmacy menu items
export const PHARMACY_ITEMS: PharmacyItem[] = [
  {
    id: 'pregnancy_test',
    name: 'Teste de Gravidez',
    description: 'Descubra se está grávida. Apenas para Lunari.',
    price: 150,
    type: 'pregnancy_test',
    icon: '🧪',
    image: pregnancyTestImg,
    restrictedTo: 'lunari',
  },
  {
    id: 'scratch_card',
    name: 'Raspadinha da Sorte',
    description: 'Tente a sorte! Ganhe até ₭5.000 ou Vale Alimentação.',
    price: 100,
    type: 'scratch_card',
    icon: '🎰',
    image: scratchCardImg,
  },
  {
    id: 'contraceptive_7d',
    name: 'Anticoncepcional (7 dias)',
    description: 'Proteção contra gravidez por 7 dias.',
    price: 200,
    type: 'contraceptive',
    icon: '💊',
    image: contraceptiveImg,
    duration: 7,
  },
  {
    id: 'contraceptive_14d',
    name: 'Anticoncepcional (14 dias)',
    description: 'Proteção contra gravidez por 14 dias.',
    price: 350,
    type: 'contraceptive',
    icon: '💊',
    image: contraceptiveImg,
    duration: 14,
  },
  {
    id: 'medicine_cold',
    name: 'Remédio para Resfriado',
    description: 'Cura resfriado em 30 minutos.',
    price: 80,
    type: 'medicine',
    icon: '💉',
    image: medicineColdImg,
  },
  {
    id: 'medicine_fever',
    name: 'Antitérmico',
    description: 'Reduz febre imediatamente.',
    price: 100,
    type: 'medicine',
    icon: '🌡️',
    image: medicineFeverImg,
  },
  {
    id: 'medicine_pain',
    name: 'Analgésico',
    description: 'Alivia dores em geral.',
    price: 60,
    type: 'medicine',
    icon: '💊',
    image: medicinePainImg,
  },
];

// Scratch card prize configuration
export const SCRATCH_SYMBOLS = ['💰', '🎁', '⭐', '🍀', '💎', '🎯'];

export const SCRATCH_PRIZES = {
  '💰💰💰': { type: 'money' as const, amount: 5000, label: '₭5.000' },
  '💎💎💎': { type: 'money' as const, amount: 3000, label: '₭3.000' },
  '⭐⭐⭐': { type: 'money' as const, amount: 1000, label: '₭1.000' },
  '🍀🍀🍀': { type: 'food_voucher' as const, amount: 500, label: 'Vale ₭500' },
  '🎁🎁🎁': { type: 'food_voucher' as const, amount: 300, label: 'Vale ₭300' },
  '🎯🎯🎯': { type: 'food_voucher' as const, amount: 200, label: 'Vale ₭200' },
};

// Pregnancy duration configuration (in days)
export const PREGNANCY_MIN_DAYS = 14; // 2 weeks
export const PREGNANCY_MAX_DAYS = 21; // 3 weeks
