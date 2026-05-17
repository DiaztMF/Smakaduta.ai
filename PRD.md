# Product Requirement Document (PRD)

## Project Name: Smakaduta.ai

**Format Version:** 1.0.0

**Target Release:** Mei 2026

**Author:** Tim Pengembang RPL SMKN 2 Surakarta

**Status:** Approved / Ready for Development

---

## 1. Project Overview & Objectives

### 1.1 Executive Summary

**Smakaduta.ai** adalah platform aplikasi web chatbot berbasis Kecerdasan Buatan (AI) yang dikembangkan khusus untuk SMK Negeri 2 Surakarta (Smakaduta/Stemsa). Fokus utama platform ini dalam jangka pendek adalah melayani kebutuhan informasi seputar Penerimaan Peserta Didik Baru (PPDB) 2026, dan jangka panjang sebagai asisten pembelajaran berbasis dokumen mata pelajaran (RAG).

Proyek ini mengusung prinsip **zero-cost infrastructure**, di mana seluruh sistem memanfaatkan penyedia _free tier_ terbaik namun tetap menjamin performa tinggi, stabilitas, dan keamanan data sekolah.

### 1.2 Objectives

- **Mengotomatisasi Layanan Informasi:** Membantu panitia PPDB menghemat waktu dengan menjawab hingga 80% pertanyaan berulang (FAQ) dari calon siswa dan orang tua secara otomatis selama 24/7.
- **Akurasi Data Tanpa Halusinasi:** Menyediakan jawaban yang 100% valid berbasis dokumen resmi sekolah melalui implementasi _Retrieval-Augmented Generation_ (RAG).
- **Skalabilitas Ekonomis:** Mampu menangani lonjakan trafik hingga 700+ pengguna aktif tanpa biaya sewa server komputasi AI.

---

## 2. Target Audience & User Personas

1. **Calon Siswa Baru & Orang Tua (End-User):** Pengguna awam yang membutuhkan jawaban cepat, ramah, dan mudah dipahami terkait alur pendaftaran, kuota zonasi, kelengkapan berkas, dan profil jurusan di Stemsa.
2. **Panitia PPDB & Guru (Admin):** Pengguna internal yang bertanggung jawab menyuntikkan informasi terbaru, regulasi dinamis dari dinas pendidikan, atau dokumen buku mapel ke dalam sistem tanpa menyentuh kode program.

---

## 3. Sistem Arsitektur & Tech Stack

Aplikasi dibangun di atas infrastruktur modern berskala industri dengan efisiensi ruang penyimpanan lokal menggunakan paket manajer `pnpm`.

```
[ Client Browser ] <---> [ Next.js Frontend (Shadcn UI) ]
                                   │
                                   ▼
                       [ Next.js Server Actions ]
                                   │
          ┌────────────────────────┴────────────────────────┐
          ▼                                                 ▼
[ Vercel AI Gateway ]                            [ Neon Database (Postgres) ]
  (Caching Enabled)                                  (pgvector Extension)
          │                                                 │
          ▼                                                 │ (Vector Search)
[ OpenRouter API ]                                          │
  ├─ Chat: nvidia/nemotron-3-super-120b-a12b:free           ◀┘
  └─ Embed: nvidia/llama-nemotron-embed-vl-1b-v2:free

```

### 3.1 Spesifikasi Teknologi

| Komponen                 | Spesifikasi Teknologi                       | Keterangan / Alasan                                                                                                                  |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework Core**       | Next.js 15 (App Router)                     | Optimasi SEO, Server-Side Rendering (SSR), dan Edge Runtime.                                                                         |
| **Package Manager**      | `pnpm`                                      | Manajemen _global store_ yang hemat ruang penyimpanan _secondary drive_.                                                             |
| **Interface & Styling**  | Tailwind CSS + Shadcn UI                    | Komponen antarmuka yang bersih, cepat di-develop, dan responsif di _mobile_.                                                         |
| **AI Integration**       | Vercel AI SDK Core & `ai/react`             | Pengelolaan _streaming UI_ terpadu via _hook_ `useChat`.                                                                             |
| **Proxy & Optimization** | Vercel AI Gateway                           | Manajemen _rate limit_, _observability_, dan fitur _smart caching_.                                                                  |
| **LLM Engine (Chat)**    | `nvidia/nemotron-3-super-120b-a12b:free`    | Model penalaran tinggi dengan kapasitas 120B parameter gratis via OpenRouter.                                                        |
| **Vector Database**      | Neon Database (Serverless Postgres)         | Penyimpanan vektor menggunakan tipe `halfvec` dari ekstensi `pgvector` (versi 0.7.0+) untuk mendukung indeks HNSW pada 2048 dimensi. |
| **Embedding Model**      | `nvidia/llama-nemotron-embed-vl-1b-v2:free` | Mengubah teks dokumen sekolah menjadi koordinat vektor secara gratis.                                                                |
| **PDF Parser**           | `pdf-parse`                                 | Library backend untuk ekstraksi teks dari buku panduan dan mapel.                                                                    |

---

## 4. Key Functional Requirements (Fitur Utama)

### 4.1 F-01: Real-Time Streaming Chat Interface (Sisi Pengguna)

- **S-01.1:** Tampilan antarmuka chat bergaya asisten virtual ("Kak Duta") yang mendukung mode _light_ dan _dark_.
- **S-01.2:** Chatbot wajib merespon menggunakan metode _streaming text_ (mengetik kata demi kata secara _real-time_) untuk mengurangi persepsi waktu tunggu pengguna.
- **S-01.3:** Input teks dan tombol kirim otomatis terkunci (_disabled_) ketika AI sedang memproses jawaban guna mencegah _spamming request_.

### 4.2 F-02: Dashboard Manajemen Pengetahuan Khusus Admin (Sisi Internal)

- **S-02.1:** Menyediakan halaman khusus (`/admin`) yang dilindungi sistem autentikasi ketat untuk panitia PPDB.
- **S-02.2:** Fitur unggah file PDF (Buku Panduan PPDB/Buku Mapel) dan input teks manual untuk pengumuman mendadak.
- **S-02.3:** Sistem otomatis memotong teks (_chunking_) dengan formula:

$$\text{Chunk Size} = 1000 \text{ karakter}, \quad \text{Chunk Overlap} = 200 \text{ karakter}$$

- **S-02.4:** Sistem otomatis mengubah setiap potongan teks menjadi vektor melalui API Nvidia Embedding dan menyimpannya ke Neon DB menggunakan tipe data `halfvec` berdimensi 2048, lengkap dengan indeks HNSW (Hierarchical Navigable Small World) menggunakan metrik kemiripan Cosine (`cosine distance`) untuk pencarian kilat.

### 4.3 F-03: Vercel AI Gateway Smart Caching (Sistem Hemat Kuota)

- **S-03.1:** Semua lalu lintas data chat dari pengguna umum wajib melewati Vercel AI Gateway.
- **S-03.2:** Mengaktifkan fitur _caching_ dengan durasi simpan (TTL) minimal 12 jam untuk pertanyaan bersifat statis (contoh: syarat pendaftaran, lokasi sekolah, jadwal ujian).

### 4.4 F-04: Multi-Model Automated Failover (Sistem Ban Serep)

- **S-04.1:** Kode backend wajib dibungkus dengan _nested try-catch_ untuk mengantisipasi kegagalan sistem atau limitasi kuota per menit (RPM) dari model utama.
- **S-04.2:** Jika model utama (`Nvidia Nemotron`) gagal merespon, sistem wajib dialihkan secara otomatis ke model alternatif (`Meta Llama 3.3 70B Free` atau `Gemini 2.5 Flash Free`) dalam waktu kurang dari 2 detik tanpa interupsi pada layar pengguna.

---

## 5. Security & Access Control (RBAC)

Keamanan data menjadi prioritas utama untuk mencegah pihak luar menyuntikkan instruksi palsu (_prompt injection_) atau merusak basis data RAG sekolah.

- **Role-Based Access Control (RBAC):**
- **Role USER:** Hanya memiliki hak akses membaca (_read-only_) pada endpoint publik chat. Tidak memiliki akses ke skema database vektor.
- **Role ADMIN:** Memiliki hak akses penuh (_read, write, delete_) pada modul manajemen data dan halaman `/admin`.

- **Proteksi Route Middleware:** Next.js Middleware wajib menyaring setiap request ke direktori `/admin`. Jika sesi admin tidak valid, user otomatis dilempar ke halaman login utama.
- **Penyimpanan Kunci Rahasia:** API Key dari OpenRouter, Google AI Studio, dan string koneksi database Neon wajib disimpan secara aman di dalam Environment Variables Vercel (`.env.production`) dan dilarang keras bocor ke sisi klien (_client-side_).

---

## 6. Alur Pemrosesan Data RAG (Retrieval Pipeline)

Ketika pengguna mengirimkan pertanyaan seputar sekolah, sistem akan memprosesnya melalui tahapan berikut:

1. **Vektorisasi Kueri:** Pertanyaan pengguna diubah menjadi representasi numerik menggunakan model embedding `nvidia/llama-nemotron-embed-vl-1b-v2:free`.
2. **Pencarian Kedekatan Vektor (Cosine Similarity):** Server Next.js melakukan query pencarian ke tabel `halfvec` di Neon DB menggunakan operator kedekatan vektor (`<=>` pada pgvector) yang telah dioptimasi oleh indeks HNSW untuk menarik maksimal 3 potongan teks (_chunks_) yang paling relevan.
3. **Injeksi Konteks ke Prompt:** Potongan teks yang ditemukan digabungkan ke dalam instruksi sistem (_system prompt_) LLM sebagai dokumen sumber yang sah.
4. **Generasi Jawaban:** Model `nvidia/nemotron-3-super-120b-a12b:free` menyusun jawaban akhir berdasarkan konteks tersebut dan mengirimkannya kembali ke pengguna.

---

## 7. Non-Functional Requirements (NFR)

- **Performa Kecepatan:** Waktu respon awal (_Time to First Token_) diusahakan kurang dari 1.5 detik menggunakan Vercel Edge Runtime.
- **Ketersediaan (Availability):** Sistem harus tetap berjalan 99.9% selama masa pendaftaran PPDB berkat skema _failover multi-model_.
- **Skalabilitas Pasif:** Dengan kombinasi Vercel AI Gateway Cache, kuota _free tier_ harus mampu melayani lonjakan hingga 700+ user aktif harian tanpa mengalami _crash_ akibat kode error `429 (Too Many Requests)`.
- **Pengalaman Pengguna (UX):** Antarmuka harus ramah ponsel (_mobile-friendly_) mengingat mayoritas orang tua siswa mengakses informasi melalui perangkat _smartphone_.
