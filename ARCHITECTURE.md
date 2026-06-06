# Architecture technique

## Stack

- Next.js App Router avec TypeScript.
- Tailwind CSS pour le design sombre premium.
- MySQL local avec Prisma.
- API routes Next.js pour connecter le front office et le back office à la base.

## Base locale

Connexion locale :

```env
DATABASE_URL="mysql://root:root@localhost:3306/kvn_footwear"
```

Commandes utiles :

```bash
npm run db:create
npm run db:migrate -- --name init
npm run db:seed
```

## Dossiers principaux

- `src/app` : routes publiques et routes `admin`.
- `src/components/layout` : header, footer, shell admin.
- `src/components/product` : catalogue, cartes, fiche produit, visuel maillot.
- `src/components/cart` : panier client.
- `src/components/checkout` : checkout, création commande, confirmation WhatsApp.
- `src/components/admin` : dashboard, login, produits, commandes, catégories, équipes, stock.
- `src/lib` : types, panier, commandes, WhatsApp, formatage, stockage local, API future.
- `src/data` : catalogue initial, catégories, équipes, tailles et numéro WhatsApp.
- `prisma/schema.prisma` : schéma MySQL.
- `prisma/seed.ts` : données initiales.

## Modèles de données

Les types métier sont centralisés dans `src/lib/types.ts` :

- `Product` : prix maillot, prix pack, prix flocage, stock par taille, équipe, catégorie, visuel, images.
- `ProductReview` : avis client lié à un produit, avec nom, note, commentaire et date.
- `CartItem` : produit choisi, taille, type article, quantité, flocage, prix unitaire.
- `Order` : client, lignes de commande, total, statut, message WhatsApp.
- `OrderStatus` : `new`, `confirmed`, `preparing`, `ready`, `delivered`, `cancelled`.

## Flux commande

1. Le client ajoute un article au panier via `CartProvider`.
2. Le checkout récupère les informations client.
3. `createOrder` enregistre la commande dans `localStorage`.
4. `POST /api/orders` enregistre la commande dans MySQL.
5. `buildWhatsAppMessage` génère le message complet.
6. La page confirmation redirige vers `wa.me` avec le message prérempli.
7. Le back office lit la même commande et permet de changer son statut.

## Photos produit

Le back office propose un dépôt de photos dans `ProductImageUploader`.

- En mode démo, les fichiers JPG, PNG et WEBP sont convertis en data URL et stockés dans `Product.images`.
- La première photo devient l'image principale du catalogue, de la fiche produit et du panier.
- Si aucun fichier n'est importé, le site affiche un emplacement "Photo à ajouter", pas un visuel maillot généré.

## Connexion backend future

Les routes `src/app/api/*` peuvent ensuite être remplacées par une API Symfony ou Laravel :

- `GET/POST /products`
- `GET/POST /products/{id}/reviews`
- `GET/POST /orders`
- `PATCH /orders/{id}/status`
- `GET/POST/PUT/DELETE /categories`
- `GET/POST/PUT/DELETE /teams`
- `GET/PUT /sizes`

Le login local doit être remplacé par une vraie session backend avec cookie HTTP-only.
