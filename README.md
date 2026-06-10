# Devyly

Developer-first kariyer platformu. Profil, CV builder, iş ilanları, başvuru takibi, recruiter keşfi ve dahili mesajlaşma.

## Tech Stack

**Backend:** Python · Django · Django REST Framework · SimpleJWT · Django Channels  
**Frontend:** Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui  
**Database:** PostgreSQL (Supabase)  
**Realtime:** Django Channels (WebSocket)  
**Deploy hedefi:** Vercel (frontend) · Render (backend) · Supabase (db)

## Domain

| Ortam | URL |
|---|---|
| Frontend | `https://devyly.com` |
| Backend API | `https://api.devyly.com` |

## Kurulum (Local)

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
# veya: source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # değerleri doldur
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # değerleri doldur
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

```
SECRET_KEY=...
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://...
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Örnek production değerleri için `backend/.env.example` dosyasına bak.

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Production için: `NEXT_PUBLIC_API_URL=https://api.devyly.com/api`

## Temel Özellikler

- Developer ve Recruiter rolleri
- Email doğrulama (kayıt akışı)
- Telefon doğrulama (OTP)
- CV Builder (PDF export)
- Feed, beğeni, yorum, repost
- Dahili mesajlaşma (WebSocket)
- İlan yönetimi ve başvuru takibi
- Anlık bildirimler
