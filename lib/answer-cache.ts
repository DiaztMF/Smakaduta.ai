/**
 * Pre-computed Answer Cache untuk Smakaduta.ai
 *
 * Strategi: Pertanyaan yang sudah diketahui (default suggestions) mendapatkan
 * jawaban yang sudah disiapkan sebelumnya, melewati pipeline RAG (embedding + DB search).
 *
 * Cara kerja:
 * 1. Normalisasi teks pertanyaan (lowercase, hapus tanda baca).
 * 2. Cek apakah ada keyword dari cache yang cocok.
 * 3. Jika cocok → kembalikan jawaban cache (0ms RAG latency).
 * 4. Jika tidak → jalankan RAG pipeline normal.
 */

export interface CachedAnswer {
  /** Jawaban lengkap dalam markdown */
  answer: string;
  /** Nama sumber untuk transparansi */
  sourceName: string;
}

/**
 * Daftar keyword trigger → jawaban cache.
 * Setiap entry memiliki array keywords: jika SALAH SATU cocok, cache digunakan.
 * Urutan dari yang paling spesifik ke paling umum.
 */
const ANSWER_CACHE: Array<{
  keywords: string[];
  response: CachedAnswer;
}> = [
  {
    keywords: ["syarat daftar ppdb", "syarat ppdb", "persyaratan ppdb", "syarat pendaftaran", "dokumen ppdb", "berkas ppdb"],
    response: {
      sourceName: "Persyaratan PPDB 2026",
      answer: `## 📋 Syarat Daftar PPDB 2026 SMKN 2 Surakarta

### Persyaratan Umum
- Lulus SMP/MTs/sederajat tahun **2026 atau sebelumnya**
- Usia **maksimal 21 tahun** per 1 Juli 2026
- Memiliki Ijazah atau **Surat Keterangan Lulus (SKL)**

### Dokumen yang Harus Disiapkan
| Dokumen | Keterangan |
|---------|-----------|
| Kartu Keluarga (KK) | Asli + fotokopi |
| Akta Kelahiran | Asli + fotokopi |
| Ijazah / SKL | Dari sekolah asal |
| Rapor Semester 1–5 | Fotokopi legalisir |
| Pas Foto 3×4 | 4 lembar, latar **merah** |
| SKTM | Khusus jalur afirmasi |
| Sertifikat Prestasi | Khusus jalur prestasi |

### 💰 Biaya Pendaftaran
> **GRATIS!** PPDB SMKN 2 Surakarta tidak dipungut biaya apapun. Waspada penipuan!

Butuh info lebih lanjut? Hubungi Hotline PPDB: **(0271) 714901** 📞`,
    },
  },
  {
    keywords: ["jurusan apa saja", "program keahlian", "jurusan di smkn 2", "jurusan smkn 2", "pilihan jurusan", "kompetensi keahlian"],
    response: {
      sourceName: "Jurusan SMKN 2 Surakarta",
      answer: `## 🎓 Jurusan / Kompetensi Keahlian SMKN 2 Surakarta

SMKN 2 Surakarta menawarkan **6 jurusan unggulan**:

### 💻 Teknologi & Informatika
| Jurusan | Singkatan | Prospek Karir |
|---------|-----------|---------------|
| Teknik Jaringan Komputer & Telekomunikasi | **TJKT** | Network Engineer, IT Support |
| Rekayasa Perangkat Lunak | **RPL** | Web/Mobile Developer, Software Engineer |

### 🎨 Seni & Kreatif
| Jurusan | Singkatan | Prospek Karir |
|---------|-----------|---------------|
| Desain Komunikasi Visual | **DKV** | Graphic Designer, UI/UX, Fotografer |
| Animasi | **Animasi** | Animator, Motion Designer, Game Artist |

### ⚡ Teknik
| Jurusan | Singkatan | Prospek Karir |
|---------|-----------|---------------|
| Teknik Pendingin & Tata Udara | **TPTU** | Teknisi AC, HVAC Engineer |
| Teknik Instalasi Tenaga Listrik | **TITL** | Teknisi Listrik, Electrical Engineer |

> 💡 Kamu bisa pilih **maksimal 2 jurusan** saat mendaftar. Mau tahu lebih detail tentang jurusan tertentu? Tanyakan saja!`,
    },
  },
  {
    keywords: ["cara daftar zonasi", "jalur zonasi", "daftar zonasi", "zona ppdb", "wilayah zonasi", "zona 1", "zona 2"],
    response: {
      sourceName: "Jalur & Zonasi PPDB 2026",
      answer: `## 🗺️ Jalur Zonasi PPDB 2026 SMKN 2 Surakarta

### Apa itu Jalur Zonasi?
Jalur penerimaan berdasarkan **jarak domisili** (sesuai KK) ke sekolah. Kuota: **50% dari total siswa baru**.

### Cara Daftar Jalur Zonasi
1. Akses **https://ppdb.jatengprov.go.id**
2. Buat akun menggunakan NIK
3. Pilih **SMKN 2 Surakarta** sebagai sekolah tujuan
4. Pilih **Jalur Zonasi**
5. Upload dokumen (KK wajib dengan alamat sesuai domisili)
6. Cetak bukti pendaftaran
7. Verifikasi berkas ke sekolah sesuai jadwal

### Wilayah Zona Prioritas (Zona 1)
- **Kec. Banjarsari** — Manahan, Nusukan, Kadipiro, Sumber, dll.
- **Kec. Laweyan** — Pajang, Laweyan, Panularan, Sriwedari, dll.
- **Kec. Jebres** — Jebres, Mojosongo, Jagalan, dll.

### ⚠️ Ketentuan Penting
- KK harus **diterbitkan minimal 1 tahun** sebelum pendaftaran
- Jarak dihitung dari koordinat GPS alamat di KK
- Pindah KK setelah pengumuman PPDB dianggap **tidak sah**

Jarak rumahmu jauh dari sekolah? Coba jalur **Prestasi** ya!`,
    },
  },
  {
    keywords: ["jadwal pendaftaran", "kapan ppdb", "tanggal ppdb", "waktu pendaftaran", "kapan dibuka", "kapan daftar"],
    response: {
      sourceName: "Jadwal PPDB 2026",
      answer: `## 🗓️ Jadwal PPDB 2026 SMKN 2 Surakarta

| Kegiatan | Tanggal |
|----------|---------|
| 📝 Pendaftaran Online | **2 Juni – 14 Juni 2026** |
| 📁 Verifikasi Berkas | **5 Juni – 16 Juni 2026** |
| 📢 Pengumuman Tahap 1 | **19 Juni 2026** |
| ✋ Masa Sanggah | **20 – 21 Juni 2026** |
| 🏆 Pengumuman Final | **23 Juni 2026** |
| ✅ Daftar Ulang | **24 – 28 Juni 2026** |
| 🎒 Orientasi Siswa (MOS) | **14 Juli 2026** |

### Cara Daftar Online
Akses → **https://ppdb.jatengprov.go.id**

### 📞 Kontak PPDB
- Hotline: **(0271) 714901**
- Email: **ppdb@smkn2surakarta.sch.id**
- Lokasi Posko: Gedung Utama SMKN 2, Jl. LU. Adisucipto No. 33

> ⏰ Segera siapkan dokumen sebelum pendaftaran dibuka ya!`,
    },
  },
  {
    keywords: ["ekstrakurikuler", "ekskul", "kegiatan siswa", "organisasi sekolah", "osis", "pramuka", "club"],
    response: {
      sourceName: "Ekstrakurikuler SMKN 2 Surakarta",
      answer: `## ⚽ Ekstrakurikuler SMKN 2 Surakarta

### Wajib
- 🏕️ **Pramuka** — Setiap Jumat sore

### 💻 Teknologi & Sains
- 🤖 **Robotika** — Sering ikut lomba nasional
- 💻 **Coding Club** — Hackathon & competitive programming
- 📡 **IoT Lab** — Arduino, Raspberry Pi
- 🔐 **Cyber Security** — CTF Competition, ethical hacking

### 🎨 Seni & Kreativitas
- 🖌️ **Seni Rupa & Digital Art**
- 🎬 **Film & Photography** — Produksi film pendek
- 🎸 **Band & Musik** — Termasuk Marching Band

### 🏃 Olahraga
- ⚽ **Futsal** | 🏀 **Basket** | 🥋 **Pencak Silat/Karate**
- 🎮 **E-Sports** — Mobile Legends, Valorant

### 👑 Kepemimpinan & Sosial
- 🚩 **Paskibra** — Tampil di upacara tingkat kota
- 🩺 **PMR** — Palang Merah Remaja
- 🏛️ **OSIS** — Organisasi Siswa Intra Sekolah
- 🇬🇧 **English Club** — Debat & public speaking

### 🏆 Prestasi Terbaru
- 🥇 Juara 1 LKS Provinsi Jawa Tengah (RPL) 2025
- 🤖 Finalis Kompetisi Robotika Nasional 2025
- 🔐 Juara 2 CTF BSSN 2025`,
    },
  },
  {
    keywords: ["kuota jalur prestasi", "kuota prestasi", "berapa kuota", "daya tampung", "kuota ppdb", "kuota siswa"],
    response: {
      sourceName: "Kuota & Daya Tampung PPDB 2026",
      answer: `## 📊 Kuota & Daya Tampung PPDB 2026 SMKN 2 Surakarta

### Total Daya Tampung
**~360–400 siswa baru** terbagi ke semua jurusan.

### Pembagian Kuota per Jalur
| Jalur | Kuota | Keterangan |
|-------|-------|-----------|
| 🗺️ Zonasi | **50%** | Berdasarkan jarak KK ke sekolah |
| 🏆 Prestasi | **30%** | Nilai rapor + sertifikat prestasi |
| 💛 Afirmasi | **15%** | Siswa kurang mampu (SKTM) |
| 🚗 Perpindahan Orang Tua | **5%** | Orang tua pindah tugas resmi |

### Jalur Prestasi — Cara Seleksi
- Nilai rata-rata rapor semester 1–5 (minimal **70**)
- Tidak ada nilai di bawah **65** untuk Matematika, Bahasa Indonesia & Inggris
- Sertifikat prestasi akademik/non-akademik bisa menjadi nilai tambah

> 💡 Tips: Siapkan semua rapor dan sertifikat prestasmu dari sekarang untuk mendaftar jalur prestasi!`,
    },
  },
];

/**
 * Normalisasi teks: lowercase, hapus tanda baca, trim whitespace.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()\[\]"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cari jawaban dari cache berdasarkan teks pertanyaan.
 *
 * @param query - Teks pertanyaan dari user
 * @returns CachedAnswer jika ada, null jika tidak ditemukan
 */
export function findCachedAnswer(query: string): CachedAnswer | null {
  const normalized = normalizeText(query);

  for (const entry of ANSWER_CACHE) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        return entry.response;
      }
    }
  }

  return null;
}
