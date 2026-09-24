# Event Platform

Event discovery and ticketing platform (Eventbrite-like).

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Django 5 + Django REST Framework
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (planned for STEP 2)

## Quick Start

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

5. Configure Supabase credentials in `.env` (see below).

6. Run database migrations:
   ```bash
   python manage.py migrate
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

## Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database**
3. Find your connection details under **Connection string > URI**
4. Extract the following values and set them in `Backend/.env`:

   | Variable | Description |
   |---|---|
   | `SUPABASE_DB_NAME` | Database name (usually `postgres`) |
   | `SUPABASE_DB_USER` | Database user (usually `postgres`) |
   | `SUPABASE_DB_PASSWORD` | Your database password |
   | `SUPABASE_DB_HOST` | Host from the connection string (e.g. `db.xxxx.supabase.co`) |
   | `SUPABASE_DB_PORT` | Port (usually `5432`) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check |

## Project Structure

```
Backend/
├── config/          # Django project settings
│   ├── settings.py  # Configuration (DRF, CORS, Supabase)
│   └── urls.py      # Root URL routing
├── core/            # Core application
│   ├── urls.py      # API routes
│   └── views.py     # API views
├── .env.example     # Environment template
└── requirements.txt # Python dependencies

Frontend/
├── src/
│   ├── App.jsx      # Main component (Home page)
│   ├── main.jsx     # Entry point
│   └── index.css    # Tailwind CSS imports
├── .env.example     # Environment template
└── vite.config.js   # Vite configuration
```
