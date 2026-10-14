# QueueEase – Virtual Queue System for College Stationery

> Skip the Line. Save Your Time.

```
queueease/
├── frontend/   Website (HTML/CSS/JS) – mobile + desktop, light theme
├── backend/    Spring Boot 3 / Java 21 REST API + PostgreSQL
├── .env.example, .gitignore, README.md
```

## What is implemented
**Backend (Spring Boot + PostgreSQL):** create account with username + roll number + password (one account per roll number), login with BCrypt + JWT, role-based access (STUDENT / STAFF), stationery CRUD, configurable pricing / service times / shop open-close, orders with file upload (PDF, JPG, PNG, no size limit set by the app, streamed to disk, file-signature check, server-side page counting with PDFBox, server-side price calculation), daily token numbers, queue position and wait time, staff actions (accept / reject / call / process / printing / binding / ready / complete / skip), secure file preview + download (owner or staff only), in-app notifications, centralized error handling.

**Frontend:** login + create account, show/hide password (eye icon), student dashboard, stationery store, print & binding options, one token per order (a student can have several active orders at once), live queue tracking, leave queue (allowed until staff open the document) (auto-refresh every 5 s), notifications, order history; staff queue with document preview + download + accept/reject, shop management (prices, inventory, shop status), analytics (revenue, waits, peak hour).

## Run it locally – exact steps
Install: **Java 21**, **Maven**, **PostgreSQL**, and **Python** (or Node) to serve the frontend.

### 1. Create the database
```
psql -U postgres -c "CREATE DATABASE queueease;"
```
If you ran an older version before: `DROP DATABASE queueease;` first, then create it again (the old demo accounts live in the old database).

### 2. Configure the backend
```
cd backend/src/main/resources
copy application-local.properties.example application-local.properties     (Mac/Linux: cp ...)
```
Open `application-local.properties` and set:
- `spring.datasource.password` – your PostgreSQL password
- `app.jwt.secret` – any long random text (32+ characters)
- `app.staff.username` / `app.staff.password` – the staff login created on first start

This file is git-ignored, so your passwords are never pushed to GitHub.

### 3. Start the backend
```
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
Wait for "Started QueueEaseApplication". Tables, stationery, prices and the staff account are created automatically. Test: http://localhost:8080/api/health

### 4. Start the frontend (new terminal)
```
cd frontend
python -m http.server 5173
```
Open http://localhost:5173

### 5. Use it
- **Student:** *New student? Create an account* → enter a **username**, your **roll number** and a **password**. One roll number can have only one account. Next time: *Login* with username (or roll number) + password. Use the eye icon to show/hide the password.
- **Staff:** *Login* with the staff username/password you set in step 2 (defaults if you skip it: `staff` / `staff123` – change this before going live).
- There are no demo student accounts.

### Typical flow
Student → Print → upload a PDF → Confirm & Join Queue → Staff → Preview each file → Accept → Call → Process → Printing → Binding → Ready → Complete → student sees "ready for collection".

## Configuration
- Frontend → backend URL: `frontend/js/config.js`
- Backend settings: `backend/src/main/resources/application.properties` (can be overridden with environment variables: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `UPLOAD_DIR`, `STAFF_USERNAME`, `STAFF_PASSWORD` – see `.env.example`)
- Uploaded files are stored in `backend/uploads/` (git-ignored); only metadata is in PostgreSQL.

## Tests
```
cd backend
mvn test
```

## API summary
`POST /api/auth/register|login`, `GET /api/auth/me` · `GET/POST/PUT/DELETE /api/items` · `GET/PUT /api/pricing` · `GET/PUT /api/shop` · `POST /api/orders` (multipart) · `GET /api/orders` · `POST /api/queue/call-next` · `POST /api/queue/{id}/{accept|reject|call|process|printing|binding|ready|complete|skip}` · `DELETE /api/queue/leave` · `GET /api/files/{id}` · `GET /api/notifications`, `PUT /api/notifications/read-all`.
Responses use `{ "success": true/false, "message": "...", "data": ... }`.

## Deployment
- Frontend: Vercel / Netlify with root directory `frontend/` (no build step). Set `window.QE_API` in `frontend/js/config.js` to your deployed backend URL + `/api`.
- Backend: Render / Railway with the environment variables above and a hosted PostgreSQL (Neon, Supabase, Render). Set `FRONTEND_URL` to the deployed website URL.
- Note: the app sets no upload size limit, but hosting platforms and reverse proxies usually have their own (e.g. nginx `client_max_body_size`), and big files need disk space.
- Note: files are saved on the server's disk. On free hosts the disk may be wiped on redeploy; use a persistent disk or move `StorageService` to cloud storage.
