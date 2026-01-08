"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';
import { DISEASE_DETAILS, SUB_LOCATIONS } from '../constants';
import { FoodOrder, OrderItem } from '../types';

interface VIPReservation {
  id: string;
  location: string;
  reserver_id: string;
  reserver_name: string;
  price: number;
  status: string;
  created_at: string;
  guests: { id: string; user_id: string; user_name: string }[];
}

interface WorkerViewProps {
  location: string;
  role: string;
  onClose: () => void;
  onManageTeam?: () => void;
  currentUserId?: string;
}

// Salas do hospital para liberar ao paciente
const HOSPITAL_ROOMS = SUB_LOCATIONS['hospital']?.filter(r => r.restricted) || [];

export const WorkerView: React.FC<WorkerViewProps> = ({ location, role, onClose, onManageTeam, currentUserId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [pendingTreatments, setPendingTreatments] = useState<any[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [vipReservations, setVipReservations] = useState<VIPReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [preparingTimers, setPreparingTimers] = useState<Record<string, number>>({});
  const [selectingRoomFor, setSelectingRoomFor] = useState<any | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const isHospital = location === 'hospital';
  const isCreche = location === 'creche';
  const isFood = location === 'restaurante' || location === 'padaria';
  const isPharmacy = location === 'farmacia';

  // Carregar pedidos de comida
  const loadFoodOrders = useCallback(async () => {
    if (!isFood) return;
    
    try {
      const orders = await supabaseService.getPendingFoodOrders(location);
      setFoodOrders(orders);
      
      // Inicializar timers para pedidos em preparo
      const newTimers: Record<string, number> = {};
      orders.forEach(order => {
        if (order.status === 'preparing' && order.approved_at) {
          const approvedTime = new Date(order.approved_at).getTime();
          const prepTimeMs = order.preparation_time * 60 * 1000;
          const readyTime = approvedTime + prepTimeMs;
          const remaining = Math.max(0, Math.ceil((readyTime - Date.now()) / 1000));
          newTimers[order.id] = remaining;
        }
      });
      setPreparingTimers(newTimers);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  }, [isFood, location]);

  // Carregar tratamentos pendentes
  useEffect(() => {
    const loadTreatments = async () => {
      if (!isHospital) {
        setIsLoading(false);
        return;
      }
      
      try {
        const treatments = await supabaseService.getPendingTreatments();
        setPendingTreatments(treatments);
      } catch (error) {
        console.error('Erro ao carregar tratamentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTreatments();

    // Realtime subscription para atualizações
    if (isHospital) {
      const channel = supabase
        .channel('worker-treatment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'treatment_requests'
          },
          () => {
            loadTreatments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isHospital]);

  // Carregar pedidos de comida e reservas VIP
  useEffect(() => {
    const loadData = async () => {
      if (isFood) {
        await loadFoodOrders();
        
        // Carregar reservas VIP
        try {
          const reservations = await supabaseService.getPendingVIPReservations(location);
          setVipReservations(reservations);
        } catch (error) {
          console.error('Erro ao carregar reservas VIP:', error);
        }
      }
      setIsLoading(false);
    };
    
    loadData();

    if (isFood) {
      // Realtime subscription para pedidos
      const orderChannel = supabase
        .channel('worker-food-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'food_orders',
            filter: `location=eq.${location}`
          },
          () => {
            loadFoodOrders();
          }
        )
        .subscribe();

      // Realtime subscription para reservas VIP
      const vipChannel = supabase
        .channel('worker-vip-reservations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vip_reservations',
            filter: `location=eq.${location}`
          },
          async () => {
            const reservations = await supabaseService.getPendingVIPReservations(location);
            setVipReservations(reservations);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(orderChannel);
        supabase.removeChannel(vipChannel);
      };
    }
  }, [isFood, location, loadFoodOrders]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setPreparingTimers(prev => {
        const updated: Record<string, number> = {};
        Object.entries(prev).forEach(([id, seconds]) => {
          if (seconds > 0) {
            updated[id] = seconds - 1;
          } else {
            updated[id] = 0;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Abre modal para selecionar sala
  const handleSelectRoom = (treatment: any) => {
    setSelectingRoomFor(treatment);
  };

  // Aprova tratamento e libera acesso à sala selecionada
  const handleApproveWithRoom = async (treatment: any, roomName: string) => {
    if (!currentUserId) return;
    setProcessingId(treatment.id);
    
    try {
      // Aprovar tratamento com a sala necessária
      await supabaseService.approveTreatment(treatment.id, currentUserId, roomName);
      
      // Dar acesso à sala para o paciente
      await supabaseService.grantRoomAccess(
        treatment.patient_id, 
        'hospital', 
        roomName, 
        currentUserId
      );
      
      // Enviar notificação push ao paciente
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: treatment.patient_id,
            title: '🏥 Consulta Aprovada!',
            body: `Sua consulta foi aprovada! Dirija-se à ${roomName} do hospital.`,
            type: 'treatment_approved',
            url: '/',
          },
        });
      } catch (e) {
        console.warn('[Push] Falha ao enviar push de aprovação:', e);
      }
      
      setPendingTreatments(prev => prev.filter(t => t.id !== treatment.id));
      setSelectingRoomFor(null);
    } catch (error: any) {
      console.error('Erro ao aprovar tratamento:', error);
      alert(error.message || 'Erro ao aprovar tratamento');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (treatment: any) => {
    setProcessingId(treatment.id);
    
    try {
      await supabaseService.rejectTreatment(treatment.id);
      setPendingTreatments(prev => prev.filter(t => t.id !== treatment.id));
    } catch (error) {
      console.error('Erro ao rejeitar tratamento:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // FOOD ORDER HANDLERS
  const handleApproveFoodOrder = async (order: FoodOrder) => {
    if (!currentUserId) return;
    setProcessingId(order.id);
    
    try {
      await supabaseService.approveFoodOrder(order.id, currentUserId);
      
      // Iniciar timer
      setPreparingTimers(prev => ({
        ...prev,
        [order.id]: order.preparation_time * 60
      }));
      
      await loadFoodOrders();
    } catch (error: any) {
      console.error('Erro ao aprovar pedido:', error);
      alert(error.message || 'Erro ao aprovar pedido');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliverOrder = async (order: FoodOrder) => {
    setProcessingId(order.id);
    
    try {
      await supabaseService.completeFoodOrder(order.id);
      setFoodOrders(prev => prev.filter(o => o.id !== order.id));
      setPreparingTimers(prev => {
        const updated = { ...prev };
        delete updated[order.id];
        return updated;
      });
    } catch (error: any) {
      console.error('Erro ao entregar pedido:', error);
      alert(error.message || 'Erro ao entregar pedido');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelFoodOrder = async (order: FoodOrder) => {
    setProcessingId(order.id);
    
    try {
      await supabaseService.cancelFoodOrder(order.id);
      setFoodOrders(prev => prev.filter(o => o.id !== order.id));
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOrderItems = (order: FoodOrder): OrderItem[] => {
    return order.items as OrderItem[];
  };

  // VIP Reservation handlers
  const handleApproveVIP = async (reservation: VIPReservation) => {
    if (!currentUserId) return;
    setProcessingId(reservation.id);
    
    try {
      await supabaseService.approveVIPReservation(reservation.id, currentUserId);
      setVipReservations(prev => prev.filter(r => r.id !== reservation.id));
    } catch (error: any) {
      console.error('Erro ao aprovar reserva VIP:', error);
      alert(error.message || 'Erro ao aprovar reserva');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectVIP = async (reservation: VIPReservation) => {
    setProcessingId(reservation.id);
    
    try {
      await supabaseService.rejectVIPReservation(reservation.id, reservation.reserver_id, reservation.price);
      setVipReservations(prev => prev.filter(r => r.id !== reservation.id));
    } catch (error: any) {
      console.error('Erro ao rejeitar reserva VIP:', error);
      alert(error.message || 'Erro ao rejeitar reserva');
    } finally {
      setProcessingId(null);
    }
  };

  // Mock de dados para creche (para o roleplay)
  const tasks = {
    creche: [
      { id: 1, name: 'Hatsune Jr', type: 'Aluno', level: 'Iniciante', activity: 'Pintura' },
      { id: 2, name: 'Prof. Rin', type: 'Professor', level: 'Mestre', activity: 'Música' }
    ]
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="pt-16 px-8 pb-8 bg-primary/10 border-b border-primary/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Painel de Trabalho</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">{role} @ {location}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onManageTeam && (
              <button onClick={onManageTeam} className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">manage_accounts</span>
              </button>
            )}
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-rounded text-3xl">assignment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6 pb-32">
        <div className="px-2 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            {isHospital ? 'Solicitações de Tratamento' : isFood ? 'Pedidos de Comida' : 'Fila de Atendimento'}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* FOOD ORDERS */}
            {isFood && (
              foodOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="material-symbols-rounded text-4xl text-white/20">restaurant</span>
                  </div>
                  <p className="text-white/30 text-sm">Nenhum pedido pendente</p>
                </div>
              ) : (
                foodOrders.map(order => {
                  const isProcessing = processingId === order.id;
                  const isPreparing = order.status === 'preparing';
                  const timeRemaining = preparingTimers[order.id] || 0;
                  const isReady = isPreparing && timeRemaining === 0;
                  const items = getOrderItems(order);
                  
                  return (
                    <div key={order.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                            isReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            isPreparing ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            <span className="material-symbols-rounded text-2xl">
                              {isReady ? 'check_circle' : isPreparing ? 'skillet' : 'receipt_long'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-black text-white tracking-tight">
                                {items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                              </p>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                                isReady ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                isPreparing ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {isReady ? 'Pronto!' : isPreparing ? 'Em preparo' : 'Pendente'}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                              Cliente: <span className="text-primary">{order.customer_name}</span>
                              {isPreparing && !isReady && (
                                <span className="ml-2 text-amber-400">
                                  <span className="material-symbols-rounded text-[10px] align-middle">schedule</span> {formatTime(timeRemaining)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Valor</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{order.total_price} MKC</p>
                          <p className="text-[9px] text-white/30 mt-1">~{order.preparation_time}min preparo</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveFoodOrder(order)}
                              disabled={isProcessing}
                              className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span className="material-symbols-rounded text-lg">skillet</span>
                                  Iniciar Preparo
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleCancelFoodOrder(order)}
                              disabled={isProcessing}
                              className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-rounded text-lg">cancel</span>
                              Cancelar
                            </button>
                          </>
                        )}
                        
                        {isPreparing && (
                          <>
                            <button 
                              onClick={() => handleDeliverOrder(order)}
                              disabled={isProcessing}
                              className={`flex-1 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                isReady 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse' 
                                  : 'bg-emerald-600/80'
                              }`}
                            >
                              {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span className="material-symbols-rounded text-lg">local_shipping</span>
                                  Entregar Pedido
                                  {!isReady && <span className="text-white/60">({formatTime(timeRemaining)})</span>}
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleCancelFoodOrder(order)}
                              disabled={isProcessing}
                              className="py-4 px-6 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-rounded text-lg">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* VIP RESERVATIONS */}
            {isFood && vipReservations.length > 0 && (
              <>
                <div className="px-2 mt-8 mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60">
                    Reservas VIP Pendentes
                  </h3>
                </div>
                {vipReservations.map(reservation => {
                  const isProcessing = processingId === reservation.id;
                  
                  return (
                    <div key={reservation.id} className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-[40px] p-8 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                            <span className="material-symbols-rounded text-2xl">stars</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-black text-white tracking-tight">Reserva VIP</p>
                              <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                                Aguardando
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                              Responsável: <span className="text-amber-400">{reservation.reserver_name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Valor Pago</p>
                          <p className="text-lg font-black text-amber-400 italic tracking-tighter">{reservation.price} MKC</p>
                        </div>
                      </div>

                      {/* Convidados */}
                      <div className="bg-white/5 rounded-2xl p-4 mb-6">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">Convidados ({reservation.guests.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {reservation.guests.map(guest => (
                            <span key={guest.id} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl">
                              {guest.user_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleApproveVIP(reservation)}
                          disabled={isProcessing}
                          className="flex-1 py-4 rounded-2xl bg-amber-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-rounded text-lg">check_circle</span>
                              Aprovar (24h)
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleRejectVIP(reservation)}
                          disabled={isProcessing}
                          className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-rounded text-lg">cancel</span>
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* HOSPITAL */}
            {isHospital && (
              pendingTreatments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="material-symbols-rounded text-4xl text-white/20">medical_services</span>
                  </div>
                  <p className="text-white/30 text-sm">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                pendingTreatments.map(treatment => {
                  const disease = DISEASE_DETAILS[treatment.disease_id];
                  const isProcessing = processingId === treatment.id;
                  
                  return (
                    <div key={treatment.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <span className="material-symbols-rounded text-2xl">{disease?.icon || 'medical_information'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-black text-white tracking-tight">{treatment.disease_name}</p>
                              <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                                Aguardando
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                              Paciente: <span className="text-blue-400">{treatment.patient?.full_name || 'Desconhecido'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Custo</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{treatment.treatment_cost} MKC</p>
                          <p className="text-[9px] text-white/30 mt-1">Saldo: {treatment.patient?.money || 0} MKC</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleSelectRoom(treatment)}
                          disabled={isProcessing || (treatment.patient?.money || 0) < treatment.treatment_cost}
                          className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-rounded text-lg">door_open</span>
                              Liberar Sala
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleReject(treatment)}
                          disabled={isProcessing}
                          className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-rounded text-lg">cancel</span>
                          Rejeitar
                        </button>
                      </div>
                      
                      {(treatment.patient?.money || 0) < treatment.treatment_cost && (
                        <p className="text-rose-400 text-[10px] text-center mt-3 font-medium">
                          ⚠️ Paciente sem saldo suficiente
                        </p>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* CRECHE */}
            {isCreche && tasks.creche.map(task => (
               <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 flex items-center justify-between group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.type === 'Aluno' ? 'bg-pink-500/10 text-pink-500' : 'bg-primary/10 text-primary'}`}>
                      <span className="material-symbols-rounded">{task.type === 'Aluno' ? 'child_care' : 'school'}</span>
                    </div>
                    <div>
                       <p className="text-lg font-black text-white tracking-tight">{task.name}</p>
                       <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{task.type} • Atividade: <span className="text-white/80">{task.activity}</span></p>
                    </div>
                  </div>
               </div>
            ))}
          </>
        )}
      </div>

      {/* Modal de Seleção de Sala */}
      {selectingRoomFor && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-background-dark border border-white/10 rounded-[40px] p-8 w-full max-w-md animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-3xl text-emerald-400">door_open</span>
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Escolher Sala</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
                Paciente: {selectingRoomFor.patient?.full_name || 'Desconhecido'}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {HOSPITAL_ROOMS.map((room) => (
                <button
                  key={room.name}
                  onClick={() => handleApproveWithRoom(selectingRoomFor, room.name)}
                  disabled={processingId === selectingRoomFor.id}
                  className="w-full p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center space-x-4 active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-rounded text-2xl">{room.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-black text-white">{room.name}</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">Sala restrita</p>
                  </div>
                  <span className="material-symbols-rounded text-white/20">chevron_right</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectingRoomFor(null)}
              className="w-full py-4 rounded-2xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest border border-white/10 active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};