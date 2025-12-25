
import React, { useState } from 'react';

interface DbSetupModalProps {
  onClose: () => void;
}

export const DbSetupModal: React.FC<DbSetupModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- 1. TABELAS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  banner_url text,
  is_leader boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  excerpt text,
  image_url text,
  created_at timestamptz default now()
);

-- 2. SEGURANÇA
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
create policy "Public Select Profiles" on public.profiles for select using (true);
create policy "Own Update Profiles" on public.profiles for update using (auth.uid() = id);
create policy "Own Insert Profiles" on public.profiles for insert with check (auth.uid() = id);
create policy "Public Select Posts" on public.posts for select using (true);
create policy "Own Insert Posts" on public.posts for insert with check (auth.uid() = author_id);

-- 3. STORAGE (Execute isso e também crie o bucket no painel)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

create policy "Public Avatar Access" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Own Avatar Upload" on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Own Avatar Update" on storage.objects for update using ( bucket_id = 'avatars' );
create policy "Own Avatar Delete" on storage.objects for delete using ( bucket_id = 'avatars' );

-- 4. AUTOMAÇÃO
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in">
      <div className="w-full max-w-lg bg-background-dark border border-white/10 rounded-[48px] p-10 shadow-[0_0_100px_rgba(139,92,246,0.3)] flex flex-col max-h-[90vh]">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-rounded text-3xl">database</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Configuração</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Siga os passos abaixo</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20">
            <h4 className="text-white text-xs font-black uppercase mb-1">Passo 1: SQL Editor</h4>
            <p className="text-[11px] text-white/50">Copie o script abaixo e cole no SQL Editor do Supabase para criar as tabelas e permissões.</p>
          </div>
          
          <div className="bg-amber-500/10 p-5 rounded-3xl border border-amber-500/30">
            <h4 className="text-amber-500 text-xs font-black uppercase mb-1">Passo 2: Storage (Obrigatório)</h4>
            <p className="text-[11px] text-white/70">
              Vá em <strong>Storage</strong> {'>'}  <strong>New Bucket</strong>.<br/>
              Nome: <span className="text-amber-500 font-bold">avatars</span><br/>
              Marque: <span className="text-white font-bold">Public bucket</span>.
            </p>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 bg-black/40 rounded-3xl border border-white/5 p-6 overflow-hidden mb-8 group">
          <pre className="text-[9px] text-primary/70 font-mono h-full overflow-y-auto scrollbar-hide select-all whitespace-pre">
            {sqlScript}
          </pre>
          <div className="absolute top-4 right-4">
             <button 
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
             >
               {copied ? 'Copiado!' : 'Copiar'}
             </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <button onClick={onClose} className="flex-1 py-5 rounded-[28px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Fechar</button>
          <button onClick={() => window.open('https://supabase.com/dashboard', '_blank')} className="flex-1 py-5 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Abrir Supabase</button>
        </div>
      </div>
    </div>
  );
};
