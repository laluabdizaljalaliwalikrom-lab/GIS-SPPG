# Local Setup Instructions (Windows 11)

Follow these steps to run the GIS-SPPG system locally on your machine while using Supabase as the cloud database.

## 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Supabase Account** (with a project created)

## 2. Database Initialization (Supabase)
1. Log in to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project.
3. Go to the **SQL Editor** in the left sidebar.
4. Click **New Query**.
5. Copy the contents of `init_supabase.sql` from this project and paste them into the editor.
6. Click **Run**. This will enable PostGIS and create the necessary tables.

## 3. Environment Configuration
1. Open the `.env` file in the root directory.
2. Replace `YOUR_PASSWORD` and `YOUR_PROJECT_REF` in `SUPABASE_DB_URL` with your actual Supabase credentials.
   - You can find the connection string in Supabase under **Project Settings > Database > Connection string > SQLAlchemy**.

## 4. Backend Setup (FastAPI)
Open a terminal in the root directory and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend will be available at `http://localhost:8000`.

## 5. Frontend Setup (React/Vite)
Open another terminal in the root directory and run:

```powershell
cd frontend
npm install
npm start
```
The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

## 6. Verification
- Navigate to `http://localhost:5173`.
- Try adding a new SPPG Unit or Kelompok Penerima.
- Check the Supabase Dashboard to see the data reflected in your tables.
- Use the "Auto-Allocation" feature to verify PostGIS spatial logic.
