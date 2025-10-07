# PTS PaaS Application

**Simple web application dengan Node.js, Express.js, dan PostgreSQL untuk mengelola data pengguna dengan fitur upload file.**

![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express](https://img.shields.io/badge/Express.js-v4.18+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v13+-blue.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-purple.svg)

## 📋 Deskripsi

Aplikasi ini dibuat untuk memenuhi tugas cloud developer dengan fitur:
- ✅ Koneksi database PostgreSQL 
- ✅ Menyimpan dan menampilkan data pengguna (nama dan email)
- ✅ Upload dan penyimpanan foto profil di persistent storage
- ✅ Environment variables untuk konfigurasi
- ✅ RESTful API endpoints
- ✅ Responsive web interface dengan Bootstrap

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **PostgreSQL** - Database relational
- **Multer** - File upload middleware
- **EJS** - Template engine

### Frontend
- **Bootstrap 5** - CSS framework
- **Bootstrap Icons** - Icon library
- **Vanilla JavaScript** - Client-side functionality

### Tools & Environment
- **dotenv** - Environment variables management
- **nodemon** - Development server
- **cors** - Cross-Origin Resource Sharing

## 📁 Struktur Project

```
pts-paas/
├── src/
│   └── database.js          # Database configuration dan models
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Template header
│   │   └── footer.ejs       # Template footer
│   ├── index.ejs            # Halaman utama (daftar users)
│   ├── add-user.ejs         # Form tambah user
│   ├── 404.ejs              # Halaman 404
│   └── error.ejs            # Halaman error
├── public/                  # Static files (CSS, JS, images)
├── uploads/                 # Upload directory untuk foto profil
├── app.js                   # Main application file
├── package.json             # Dependencies dan scripts
├── .env                     # Environment variables (local)
├── .env.example             # Template environment variables
└── README.md                # Dokumentasi ini
```

## ⚙️ Instalasi dan Setup

### Prerequisites
- Node.js (v18 atau lebih baru)
- PostgreSQL (v13 atau lebih baru)
- npm atau yarn

### 1. Clone dan Setup Project

```bash
# Clone atau extract project
cd pts-paas

# Install dependencies
npm install
```

### 2. Setup Database PostgreSQL

#### Menggunakan PostgreSQL Local:

```sql
-- Login ke PostgreSQL
psql -U postgres

-- Buat database baru
CREATE DATABASE pts_paas_db;

-- Buat user baru (opsional)
CREATE USER pts_user WITH PASSWORD 'password123';

-- Berikan privileges
GRANT ALL PRIVILEGES ON DATABASE pts_paas_db TO pts_user;
```

### 3. Konfigurasi Environment Variables

```bash
# Copy template environment
cp .env.example .env
```

Edit file `.env`:

```env
# Database Configuration - Sesuaikan dengan setup Anda
DATABASE_URL=postgresql://username:password@localhost:5432/db_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_name
DB_USER=username
DB_PASSWORD=password

# Application Configuration
PORT=3000
NODE_ENV=development

# Storage Configuration
STORAGE_PATH=./uploads
MAX_FILE_SIZE=5000000

# Session Secret
SESSION_SECRET=your-secret-key-here
```

### 4. Jalankan Aplikasi

```bash
# Development mode (dengan auto-restart)
npm run dev

# Production mode
npm start
```

Aplikasi akan berjalan di: http://localhost:3000

## 📊 Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## 🔌 API Endpoints

### Web Routes
- `GET /` - Halaman utama (daftar users)
- `GET /add` - Form tambah user
- `POST /users` - Tambah user baru (dengan upload file)

### API Routes
- `GET /api/users` - Get semua users (JSON)
- `GET /api/users/:id` - Get user by ID (JSON)
- `PUT /api/users/:id` - Update user (JSON)
- `DELETE /api/users/:id` - Delete user (JSON)
- `GET /health` - Health check endpoint

### Contoh API Response

```json
// GET /api/users
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_image": "profile-1234567890.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

## 📸 Fitur Upload File

### Konfigurasi File Upload
- **Format Support**: JPEG, JPG, PNG, GIF, WEBP
- **Max Size**: 5MB (konfigurasi via `MAX_FILE_SIZE`)
- **Storage**: Local filesystem (`./uploads/`)
- **Naming**: Auto-generate dengan timestamp

### File Storage di Production
Untuk production, disarankan menggunakan:
- **Cloudinary** - Image CDN dengan optimization
- **AWS S3** - Scalable object storage
- **Google Cloud Storage** - Google's object storage

## 🧪 Testing

```bash
# Test koneksi database
npm run dev
# Buka browser ke http://localhost:3000/health

# Test API endpoints
curl http://localhost:3000/api/users
```

## 🔒 Security Features

- ✅ File type validation (hanya image files)
- ✅ File size limits (max 5MB)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (EJS auto-escaping)
- ✅ CORS enabled
- ✅ Error handling middleware

## 📝 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `DB_HOST` | Database host | localhost | ✅ |
| `DB_PORT` | Database port | 5432 | ✅ |
| `DB_NAME` | Database name | - | ✅ |
| `DB_USER` | Database username | - | ✅ |
| `DB_PASSWORD` | Database password | - | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `NODE_ENV` | Environment | development | ❌ |
| `STORAGE_PATH` | Upload directory | ./uploads | ❌ |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 5000000 | ❌ |
| `SESSION_SECRET` | Session secret key | - | ✅ |

