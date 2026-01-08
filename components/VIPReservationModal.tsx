import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';

interface VIPReservationModalProps {
  location: string;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  onMoneyChange?: (amount: number) => void;
}

export const VIPReservationModal: React.FC<VIPReservationModalProps> = ({
  location,
  currentUser,
  onClose,
  onSuccess,
  onMoneyChange
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState<'form' | 'guests'>('form');
  const [reserverName, setReserverName] = useState(currentUser.name);
  const [selectedGuests, setSelectedGuests] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preço baseado no local
  const price = location === 'restaurante' ? 300 : 100;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await supabaseService.getAllProfiles();
      setAllUsers(users.filter(u => u.id !== currentUser.id));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleNext = () => {
    if (!reserverName.trim()) {
      alert('Digite o nome do responsável pela reserva.');
      return;
    }
    setStep('guests');
  };

  const toggleGuest = (user: User) => {
    setSelectedGuests(prev => {
      const exists = prev.find(g => g.id === user.id);
      if (exists) {
        return prev.filter(g => g.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleSubmit = async () => {
    if (selectedGuests.length === 0) {
      alert('Selecione pelo menos um convidado.');
      return;
    }

    if ((currentUser.money || 0) < price) {
      alert(`Saldo insuficiente. Você precisa de ${price} MKC.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Desconta o dinheiro
      const newBalance = (currentUser.money || 0) - price;
      await supabaseService.updateMoney(currentUser.id, newBalance);
      onMoneyChange?.(-price);

      // Cria a reserva
      await supabaseService.createVIPReservation(
        location,
        currentUser.id,
        reserverName,
        price,
        selectedGuests
      );

      alert('Reserva enviada! Aguarde a aprovação de um funcionário.');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      alert('Erro ao criar reserva: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[600] bg-black/90 backdrop-blur-3xl flex items-end animate-in fade-in duration-400 ${isClosing ? 'animate-out fade-out' : ''}`}>
      <div className={`w-full bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 shadow-[0_-30px_120px_rgba(0,0,0,1)] max-h-[85vh] overflow-hidden flex flex-col ${isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom duration-500'}`}>
        <div className="w-16 h-1.5 bg-white/5 rounded-full mx-auto mb-6 flex-shrink-0"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <span className="material-symbols-rounded text-3xl">stars</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Reserva VIP</h2>
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] mt-1.5">{location}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Preço */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-[32px] p-6 mb-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-rounded text-amber-400 text-2xl">payments</span>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Valor da Reserva</p>
              <p className="text-xl font-black text-amber-400 italic tracking-tighter">{price} MKC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Seu Saldo</p>
            <p className={`text-lg font-black italic tracking-tighter ${(currentUser.money || 0) >= price ? 'text-emerald-400' : 'text-red-400'}`}>
              {(currentUser.money || 0).toFixed(0)} MKC
            </p>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 'form' && (
          <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Nome do Responsável</label>
              <input
                type="text"
                value={reserverName}
                onChange={(e) => setReserverName(e.target.value)}
                placeholder="Digite o nome..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-[15px] font-bold placeholder:text-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center space-x-3 mb-3">
                <span className="material-symbols-rounded text-primary text-lg">info</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Como funciona</span>
              </div>
              <ul className="space-y-2 text-[11px] text-white/50">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-400">1.</span>
                  <span>Preencha o nome do responsável pela reserva</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-400">2.</span>
                  <span>Selecione os convidados que terão acesso</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-400">3.</span>
                  <span>Aguarde um funcionário aprovar sua reserva</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-400">4.</span>
                  <span>Após aprovado, a reserva dura 24 horas</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={handleNext}
              disabled={(currentUser.money || 0) < price}
              className="w-full py-5 rounded-2xl bg-amber-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo: Selecionar Convidados
            </button>
          </div>
        )}

        {/* Step 2: Select Guests */}
        {step === 'guests' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <button onClick={() => setStep('form')} className="flex items-center space-x-2 text-white/40">
                <span className="material-symbols-rounded">arrow_back</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
              </button>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {selectedGuests.length} selecionado(s)
              </span>
            </div>

            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 mb-4 flex-shrink-0">
              Selecione os Convidados
            </p>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-4">
                {allUsers.map(user => {
                  const isSelected = selectedGuests.some(g => g.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleGuest(user)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-amber-500/20 border-amber-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <img src={user.avatar} className="w-12 h-12 rounded-xl border border-white/10" alt={user.name} />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-white/40">@{user.username}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/20'
                      }`}>
                        <span className="material-symbols-rounded text-lg">{isSelected ? 'check' : 'add'}</span>
                      </div>
                    </button>
                  );
                })}

                {allUsers.length === 0 && (
                  <div className="text-center py-10">
                    <span className="material-symbols-rounded text-4xl text-white/10 mb-2">group_off</span>
                    <p className="text-white/30 text-sm">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || selectedGuests.length === 0}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-4"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                `Confirmar Reserva (${price} MKC)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
