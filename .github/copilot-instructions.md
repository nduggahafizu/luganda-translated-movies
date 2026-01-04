# Copilot Instructions for Luganda Translated Movies

## Project Overview
- **Purpose:** Modern streaming platform for Luganda-translated (VJ) movies, with user authentication, subscription plans, and Uganda TV integration.
- **Stack:** HTML, CSS, JavaScript (frontend), Node.js/Express (backend), MongoDB (database).
- **Key Features:** Movie browsing, VJ profiles, live TV, subscription/payment (Pesapal), authentication (JWT), admin interface for content management.

## Architecture & Key Patterns
- **Frontend:** Static HTML/CSS/JS in root; main logic in `js/` (e.g., `main.js`, `luganda-movies-api.js`).
- **Backend:** All server code in `server/` (Express app in `server.js`).
  - **Models:** `server/models/` (e.g., `LugandaMovie.js`, `User.js`)
  - **Controllers:** `server/controllers/` (e.g., `lugandaMovieController.js`)
  - **Routes:** `server/routes/` (e.g., `luganda-movies.js`)
- **Data Flow:** REST API endpoints serve movie/user/payment data to frontend JS clients.
- **Authentication:** JWT-based, see `authController.js` and `auth.js` route.
- **Payments:** Pesapal integration, secrets in `.env`.

## Developer Workflows
- **Backend:**
  - Install deps: `cd server && npm install`
  - Start server: `npm start` (runs on port from `.env`)
  - Environment: Copy `.env.example` or see README for required vars.
- **Frontend:**
  - Open `index.html` directly or run a static server (e.g., `python -m http.server 8000`)
- **Database:**
  - MongoDB must be running locally or as configured in `.env`.
  - Movie data can be added via admin interface or direct DB insert.

## Project Conventions
- **Color scheme:** See CSS variables in `css/style.css`.
- **Movie data model:** See README and `LugandaMovie.js` for required fields.
- **File structure:** Keep new backend logic in `server/` subfolders; frontend logic in `js/`.
- **Security:** Use JWT for API auth, bcrypt for passwords, validate all inputs.
- **Legal:** Always credit VJs, respect content rights, see README for compliance notes.

## Integration Points
- **Pesapal:** Payment keys in `.env`, logic in payment controller/routes.
- **Uganda TV:** API client in `uganda-tv-api.js`, page in `uganda-tv.html`.
- **Admin:** Admin interface for adding movies, see admin.html and related JS.

## Examples
- Add a new movie: Use admin interface or POST to `/api/luganda-movies` with the movie schema.
- Add a new VJ: Update VJ list in DB and reference in movie metadata.
- Add a new payment plan: Update subscription logic in backend and frontend.

## References
- See `README.md` for setup, features, and legal notes.
- See `server/` for backend logic, `js/` for frontend API usage.

---

**For AI agents:**
- Always follow project-specific data models and workflows.
- Reference actual file structure and code patterns before generating new logic.
- When in doubt, check the README or existing controllers/models for examples.
