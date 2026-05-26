export const MOCK_BOOKS = [
  {
    id: '1', title: "L'Alchimiste", author: 'Paulo Coelho', genre: 'Roman',
    price: 4.00, mode: 'vente', etat: 'Très bon', ville: 'Paris 11e',
    description: "Lu une seule fois, comme neuf. Un roman philosophique sur la quête de soi. Pages intactes, couverture impeccable.",
    isbn: '9782070612888', images: [], created_at: '2024-03-10T10:00:00Z',
    seller_id: 'u1',
    profiles: { prenom: 'Marie', ville: 'Paris 11e', avatar_url: null, created_at: '2023-06-01T00:00:00Z' },
    _sellerStats: { sold: 23, rating: 4.9 },
  },
  {
    id: '2', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Sciences humaines',
    price: null, mode: 'échange', etat: 'Bon', ville: 'Rennes',
    description: "Cherche en échange un essai de philosophie ou d'économie. Livre en bon état, quelques annotations légères au crayon.",
    images: [], created_at: '2024-03-09T09:00:00Z',
    seller_id: 'u2',
    profiles: { prenom: 'Lucas', ville: 'Rennes', avatar_url: null, created_at: '2023-09-15T00:00:00Z' },
    _sellerStats: { sold: 8, rating: 4.7 },
  },
  {
    id: '3', title: 'Atomic Habits', author: 'James Clear', genre: 'Développement personnel',
    price: 5.00, mode: 'vente', etat: 'Bon', ville: 'Lyon',
    description: "Quelques passages soulignés au crayon, rien de gênant. Un des meilleurs livres sur la formation des habitudes.",
    images: [], created_at: '2024-03-08T14:00:00Z',
    seller_id: 'u3',
    profiles: { prenom: 'Sophie', ville: 'Lyon', avatar_url: null, created_at: '2023-04-20T00:00:00Z' },
    _sellerStats: { sold: 41, rating: 5.0 },
  },
  {
    id: '4', title: 'Harry Potter à l\'école des sorciers', author: 'J.K. Rowling', genre: 'Jeunesse',
    price: null, mode: 'don', etat: 'Correct', ville: 'Paris 9e',
    description: "Offert ! Couverture légèrement abîmée sur les bords mais toutes les pages sont là. Parfait pour un enfant.",
    images: [], created_at: '2024-03-07T11:00:00Z',
    seller_id: 'u4',
    profiles: { prenom: 'Théo', ville: 'Paris 9e', avatar_url: null, created_at: '2024-01-10T00:00:00Z' },
    _sellerStats: { sold: 5, rating: 4.8 },
  },
  {
    id: '5', title: 'Dune', author: 'Frank Herbert', genre: 'SF',
    price: null, mode: 'échange', etat: 'Très bon', ville: 'Bordeaux',
    description: "Édition de poche en excellent état. Cherche SF ou fantasy en échange — Asimov, Le Guin, Tolkien.",
    images: [], created_at: '2024-03-06T16:00:00Z',
    seller_id: 'u5',
    profiles: { prenom: 'Camille', ville: 'Bordeaux', avatar_url: null, created_at: '2023-11-05T00:00:00Z' },
    _sellerStats: { sold: 12, rating: 4.6 },
  },
  {
    id: '6', title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', genre: 'Jeunesse',
    price: 3.00, mode: 'vente', etat: 'Très bon', ville: 'Nantes',
    description: "Édition illustrée originale Gallimard. Très bon état général, une petite dédicace en première page.",
    images: [], created_at: '2024-03-05T08:00:00Z',
    seller_id: 'u6',
    profiles: { prenom: 'Emma', ville: 'Nantes', avatar_url: null, created_at: '2023-07-22T00:00:00Z' },
    _sellerStats: { sold: 17, rating: 4.9 },
  },
  {
    id: '7', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Sciences humaines',
    price: 6.00, mode: 'vente', etat: 'Bon', ville: 'Paris 5e',
    description: "Quelques passages surlignés en jaune, le contenu est intégral. Un incontournable de la psychologie cognitive.",
    images: [], created_at: '2024-03-04T13:00:00Z',
    seller_id: 'u7',
    profiles: { prenom: 'Antoine', ville: 'Paris 5e', avatar_url: null, created_at: '2023-03-15T00:00:00Z' },
    _sellerStats: { sold: 9, rating: 4.5 },
  },
  {
    id: '8', title: '1984', author: 'George Orwell', genre: 'Roman',
    price: null, mode: 'don', etat: 'Bon', ville: 'Lille',
    description: "Don gratuit, à récupérer en main propre à Lille (métro Wazemmes). L'occasion de (re)lire ce classique.",
    images: [], created_at: '2024-03-03T10:00:00Z',
    seller_id: 'u8',
    profiles: { prenom: 'Inès', ville: 'Lille', avatar_url: null, created_at: '2024-02-01T00:00:00Z' },
    _sellerStats: { sold: 6, rating: 4.8 },
  },
]

export const MOCK_CONVERSATIONS = [
  {
    id: 'c1', book_id: '2', buyer_id: 'me', seller_id: 'u2',
    books: { title: 'Sapiens', mode: 'échange' },
    profiles: { prenom: 'Lucas', avatar_url: null },
    messages: [
      { id: 'm1', sender_id: 'u2', content: "Bonjour ! Votre annonce m'intéresse. J'ai Le Monde de Sophie de Jostein Gaarder à proposer en échange — ça vous conviendrait ?", created_at: '2024-03-10T14:32:00Z', read: true },
      { id: 'm2', sender_id: 'me', content: "Bonjour ! Oui, ça m'intéresse vraiment. Il est en quel état ?", created_at: '2024-03-10T14:45:00Z', read: true },
      { id: 'm3', sender_id: 'u2', content: "Très bon état, lu une fois. Je peux vous envoyer des photos.", created_at: '2024-03-10T14:47:00Z', read: false },
    ]
  },
  {
    id: 'c2', book_id: '5', buyer_id: 'me', seller_id: 'u5',
    books: { title: 'Dune', mode: 'échange' },
    profiles: { prenom: 'Camille', avatar_url: null },
    messages: [
      { id: 'm4', sender_id: 'u5', content: "Salut ! J'ai Fondation d'Asimov à proposer pour Dune. Intéressé ?", created_at: '2024-03-09T09:15:00Z', read: true },
    ]
  },
]

export const MOCK_MY_BOOKS = [
  { id: 'mb1', title: 'La Peste', author: 'Albert Camus', mode: 'vente', price: 4, status: 'actif', etat: 'Bon', images: [] },
  { id: 'mb2', title: 'Dune T.2', author: 'Frank Herbert', mode: 'échange', price: null, status: 'actif', etat: 'Très bon', images: [] },
  { id: 'mb3', title: 'Sapiens', author: 'Y.N. Harari', mode: 'vente', price: 5, status: 'vendu', etat: 'Bon', images: [] },
]
