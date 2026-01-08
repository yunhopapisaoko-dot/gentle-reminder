"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface JobApplicationModalProps {
  location: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  onManagerAccess: () => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({ location, userId, onClose, onSuccess, onManagerAccess }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    experience: '',
    role: location === 'creche' ? 'Professor' : 'Trabalhador'
  });

  useEffect(() => {
    // Verifica se já existe uma sessão de gerente salva
    const isManager = localStorage.getItem('magic_manager_auth') === 'true';
    if (isManager && showManagerLogin) {
      onManagerAccess();
    }
  }, [showManagerLogin, onManagerAccess]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;
    
    setIsSubmitting(true);
    try {
      await supabaseService.applyForJob({
        user_id: userId,
        location,
        applicant_name: formData.name,
        applicant_age: parseInt(formData.age),
        experience: formData.experience,
        role: formData.role
      });
      alert("Ficha enviada! Aguarde a avaliação do gerente. ✨");
      onSuccess();
      handleClose();
    } catch (error: any) {
      alert("Erro ao enviar ficha: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerAccess = () => {
    if (managerPassword === 'Gerente191812') {
      localStorage.setItem('magic_manager_auth', 'true');
      onManagerAccess();
    } else {
      alert("Senha de Gerente incorreta!");
      setManagerPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-sm bg-background-dark border border-white/10 rounded-[50px] p-8 shadow-[0_0_100px_rgba(139,92,246,0.2)] ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in'}`}>
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-rounded text-3xl">contract_edit</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic uppercase leading-none">Ficha de Emprego</h2>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">{location}</p>
          </div>
        </div>

        {!showManagerLogin ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome Completo</label>
              <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Idade</label>
                <select required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary appearance-none" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})}>
                  <option value="">Selecione</option>
                  {Array.from({ length: 43 }, (_, i) => 18 + i).map(age => (
                    <option key={age} value={age}>{age} anos</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Cargo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs focus:ring-primary appearance-none" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  {location === 'creche' ? (
                    <>
                      <option value="Professor">Professor</option>
                      <option value="Aluno">Aluno (Inscrição)</option>
                    </>
                  ) : (
                    <option value="Trabalhador">Trabalhador</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Experiência (Roleplay)</label>
              <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-white text-sm focus:ring-primary resize-none" placeholder="Conte um pouco sobre sua jornada..." value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all mt-4">
              {isSubmitting ? 'Enviando...' : 'Enviar Ficha'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 mb-8 animate-in slide-in-bottom">
             <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Senha do Gerente</label>
              <input type="password" autoFocus placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-black tracking-widest focus:ring-primary" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} />
            </div>
            <button onClick={handleManagerAccess} className="w-full py-5 rounded-[28px] bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all">Acessar Painel</button>
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => setShowManagerLogin(!showManagerLogin)}
            className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors border-b border-transparent hover:border-primary/20"
          >
            {showManagerLogin ? 'Voltar para Inscrição' : 'Entrar como Gerente'}
          </button>
        </div>
      </div>
    </div>
  );
};