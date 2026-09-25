# Events.ma

Event discovery and ticketing platform (Eventbrite-like).

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Django 5 + Django REST Framework
- **Database:** Supabase (PostgreSQL) or SQLite for local development
- **Auth:** JWT

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm or yarn

### Backend

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

5. Run database migrations:
   ```bash
   python manage.py migrate
   ```

6. Seed demo data (optional):
   ```bash
   python manage.py seed_demo
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

### Running Tests

**Backend:**
```bash
cd Backend
pytest -v
```

**Frontend:**
```bash
cd Frontend
npm run lint
npm run build
```

## Demo Accounts

After running `python manage.py seed_demo`, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |
| Agent | agent@example.com | Agent123! |
| Client | client@example.com | Client123! |
| Organizer | organizer@example.com | Organizer123! |

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | Required |
| `DJANGO_DEBUG` | Debug mode | `False` |
| `DJANGO_ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `USE_SUPABASE` | Use Supabase PostgreSQL | `False` |
| `SUPABASE_DB_*` | Supabase database credentials | Required if `USE_SUPABASE=True` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |
| `QR_SECRET_KEY` | QR code signing secret | Required |
| `STRIPE_SECRET_KEY` | Stripe secret key | Optional |
| `STRIPE_PUBLIC_KEY` | Stripe public key | Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Optional |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

## Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database**
3. Find your connection details under **Connection string > URI**
4. Set `USE_SUPABASE=True` in `Backend/.env`
5. Configure the `SUPABASE_DB_*` variables

## Project Structure

```
Backend/
├── accounts/         # User management
├── config/           # Django project settings
├── core/             # Core application
├── events/           # Event management
├── tickets/          # Ticket management
├── manage.py
├── requirements.txt
└── pytest.ini

Frontend/
├── src/
│   ├── api/          # API client
│   ├── components/   # Reusable components
│   ├── context/      # React context
│   ├── pages/        # Page components
│   └── utils/        # Utility functions
├── package.json
└── vite.config.js
```

## CI/CD

This project uses GitHub Actions for continuous integration:

- **Backend tests:** Run with pytest against SQLite
- **Frontend build:** Verify the production build works
- **Linting:** Check code quality

## License

Private project.
