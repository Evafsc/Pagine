# Pagine — Marketplace de livres d'occasion

## Installation

```bash
npm install
```

## Lancer en mode démo (sans Supabase)

```bash
npm run dev
```

L'appli tourne avec des données fictives. Aucune config nécessaire.

## Activer Supabase (vraie base de données)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez `.env.example` → `.env` et remplissez vos clés
3. Exécutez le SQL ci-dessous dans l'éditeur SQL Supabase

```sql
-- Profils
create table profiles (
  id uuid references auth.users primary key,
  prenom text not null,
  ville text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Livres
create table books (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) not null,
  title text not null,
  author text not null,
  genre text,
  description text,
  isbn text,
  etat text check (etat in ('Neuf','Très bon','Bon','Correct')),
  mode text check (mode in ('vente','échange','don')) not null,
  price decimal(10,2),
  status text default 'actif' check (status in ('actif','vendu','réservé','archivé')),
  images text[],
  created_at timestamptz default now()
);

-- Favoris
create table favorites (
  user_id uuid references profiles(id),
  book_id uuid references books(id),
  primary key (user_id, book_id)
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id),
  buyer_id uuid references profiles(id),
  seller_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  sender_id uuid references profiles(id),
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Avis
create table reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references profiles(id),
  reviewed_id uuid references profiles(id),
  book_id uuid references books(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Storage bucket pour les images
insert into storage.buckets (id, name, public) values ('book-images', 'book-images', true);

-- RLS Policies (Row Level Security)
alter table profiles enable row level security;
alter table books enable row level security;
alter table favorites enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

create policy "Profiles publics" on profiles for select using (true);
create policy "Modifier son profil" on profiles for update using (auth.uid() = id);
create policy "Créer son profil" on profiles for insert with check (auth.uid() = id);

create policy "Livres publics" on books for select using (true);
create policy "Publier un livre" on books for insert with check (auth.uid() = seller_id);
create policy "Modifier son livre" on books for update using (auth.uid() = seller_id);

create policy "Voir ses favoris" on favorites for select using (auth.uid() = user_id);
create policy "Ajouter favori" on favorites for insert with check (auth.uid() = user_id);
create policy "Supprimer favori" on favorites for delete using (auth.uid() = user_id);

create policy "Voir ses conversations" on conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Créer conversation" on conversations for insert with check (auth.uid() = buyer_id);

create policy "Voir ses messages" on messages for select using (
  exists (select 1 from conversations where id = conversation_id and (buyer_id = auth.uid() or seller_id = auth.uid()))
);
create policy "Envoyer message" on messages for insert with check (auth.uid() = sender_id);
create policy "Marquer lu" on messages for update using (auth.uid() = sender_id);
```

## Déployer sur Vercel

```bash
npm run build
npx vercel --prod
```

Ajoutez vos variables d'environnement dans le dashboard Vercel.
