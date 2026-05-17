import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { resources } from "./schema";
import { chunkText } from "../chunking";
import { generateEmbedding } from "../embeddings";
import { sql } from "drizzle-orm";

/**
 * Seed data untuk Knowledge Base Smakaduta.ai
 * Berisi informasi resmi SMKN 2 Surakarta untuk PPDB 2026
 */
const SEED_DOCUMENTS: { sourceName: string; sourceType: string; content: string }[] = [
  {
    sourceName: "Profil Sekolah SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Profil SMK Negeri 2 Surakarta (Stemsa / Smakaduta)

## Identitas Sekolah
- **Nama Resmi:** SMK Negeri 2 Surakarta
- **Nama Populer:** Stemsa / Smakaduta
- **NPSN:** 20328120
- **Status:** Negeri
- **Akreditasi:** A (Unggul)
- **Alamat:** Jl. LU. Adisucipto No. 33, Manahan, Kec. Banjarsari, Kota Surakarta, Jawa Tengah 57139
- **Telepon:** (0271) 714901
- **Website:** https://smkn2surakarta.sch.id
- **Email:** smkn2solo@yahoo.co.id

## Visi
Menjadi SMK Pusat Keunggulan yang menghasilkan lulusan berkarakter, kompeten, dan berdaya saing global.

## Misi
1. Menyelenggarakan pendidikan berbasis kompetensi dan karakter.
2. Mengembangkan pembelajaran yang inovatif dan bermutu.
3. Meningkatkan kerjasama dengan dunia usaha dan industri (DUDI).
4. Mewujudkan lingkungan sekolah yang bersih, sehat, dan kondusif.
5. Mengembangkan potensi siswa melalui kegiatan ekstrakurikuler dan pengembangan diri.

## Sejarah Singkat
SMK Negeri 2 Surakarta berdiri sejak tahun 1965 dan merupakan salah satu SMK tertua dan terbaik di Kota Surakarta. Sekolah ini telah mencetak ribuan lulusan yang tersebar di berbagai industri nasional maupun internasional.`,
  },
  {
    sourceName: "Jurusan / Kompetensi Keahlian SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Jurusan / Kompetensi Keahlian di SMKN 2 Surakarta

SMKN 2 Surakarta menawarkan beberapa program keahlian unggulan:

## 1. Teknik Jaringan Komputer dan Telekomunikasi (TJKT)
- Mempelajari instalasi jaringan komputer (LAN, WAN, WLAN), konfigurasi server, keamanan jaringan, dan sistem telekomunikasi.
- Prospek kerja: Network Engineer, IT Support, Teknisi Telekomunikasi.
- Sertifikasi: MTCNA (MikroTik), CompTIA Network+.

## 2. Rekayasa Perangkat Lunak (RPL)
- Mempelajari pemrograman web, mobile, dan desktop. Termasuk database, framework modern, dan metodologi agile.
- Prospek kerja: Web Developer, Mobile Developer, Software Engineer, Data Analyst.
- Bahasa pemrograman: PHP, JavaScript, Python, Java, Kotlin.

## 3. Desain Komunikasi Visual (DKV)
- Mempelajari desain grafis, branding, ilustrasi digital, fotografi, dan videografi.
- Prospek kerja: Graphic Designer, UI/UX Designer, Content Creator, Fotografer Profesional.
- Software: Adobe Photoshop, Illustrator, InDesign, Premiere Pro, After Effects.

## 4. Animasi
- Mempelajari animasi 2D dan 3D, motion graphics, character design, dan storyboarding.
- Prospek kerja: Animator, Motion Graphic Designer, Game Artist.
- Software: Blender, Maya, Adobe Animate, Toon Boom.

## 5. Teknik Pendingin dan Tata Udara (TPTU)
- Mempelajari instalasi dan perawatan sistem pendingin (AC, kulkas, chiller) serta tata udara gedung.
- Prospek kerja: Teknisi AC, Teknisi Refrigerasi, HVAC Engineer.

## 6. Teknik Instalasi Tenaga Listrik (TITL)
- Mempelajari instalasi listrik rumah tangga dan industri, panel listrik, PLC, dan otomasi.
- Prospek kerja: Teknisi Listrik, Electrical Engineer, Teknisi PLC.

Setiap jurusan dilengkapi dengan laboratorium dan bengkel praktik yang modern sesuai standar industri.`,
  },
  {
    sourceName: "Persyaratan PPDB 2026 SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Persyaratan Penerimaan Peserta Didik Baru (PPDB) 2026

## Jalur Pendaftaran
1. **Jalur Zonasi** — Berdasarkan jarak domisili ke sekolah (kuota 50%)
2. **Jalur Prestasi/Afirmasi** — Berdasarkan nilai rapor dan prestasi akademik/non-akademik (kuota 30%)
3. **Jalur Perpindahan Orang Tua** — Untuk siswa yang orang tuanya pindah tugas (kuota 5%)
4. **Jalur Prioritas Terdekat** — Prioritas siswa berdomisili terdekat (kuota 15%)

## Persyaratan Umum
1. Lulus SMP/MTs/sederajat pada tahun 2026 atau tahun sebelumnya.
2. Usia maksimal 21 tahun pada tanggal 1 Juli 2026.
3. Memiliki Ijazah atau Surat Keterangan Lulus (SKL) dari sekolah asal.
4. Memiliki SKHUN atau rapor semester 1-5.

## Dokumen yang Dibutuhkan
- Kartu Keluarga (KK) asli dan fotokopi
- Akta Kelahiran asli dan fotokopi
- Ijazah SMP/MTs atau Surat Keterangan Lulus (SKL)
- Rapor semester 1-5 (fotokopi legalisir)
- Pas foto 3x4 sebanyak 4 lembar (latar merah)
- SKTM (bagi jalur afirmasi)
- Sertifikat prestasi (bagi jalur prestasi)
- Surat keterangan domisili dari RT/RW (jika diperlukan)

## Kriteria Nilai
- Nilai rata-rata rapor minimal 70 untuk semua mata pelajaran.
- Tidak ada nilai di bawah 65 pada mata pelajaran Matematika, Bahasa Indonesia, dan Bahasa Inggris.

## Biaya Pendaftaran
- **GRATIS** — Pendaftaran PPDB SMKN 2 Surakarta TIDAK dipungut biaya apapun.
- Waspada terhadap penipuan yang mengatasnamakan pihak sekolah.`,
  },
  {
    sourceName: "Jadwal PPDB 2026 SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Jadwal PPDB 2026 SMKN 2 Surakarta

## Timeline Pendaftaran
| Kegiatan | Tanggal |
|----------|---------|
| Pendaftaran Online | 2 Juni - 14 Juni 2026 |
| Verifikasi Berkas | 5 Juni - 16 Juni 2026 |
| Pengumuman Hasil Seleksi Tahap 1 | 19 Juni 2026 |
| Masa Sanggah | 20 - 21 Juni 2026 |
| Pengumuman Final | 23 Juni 2026 |
| Daftar Ulang | 24 - 28 Juni 2026 |
| Awal Masa Orientasi Siswa | 14 Juli 2026 |

## Cara Pendaftaran
1. Akses situs PPDB Jawa Tengah di: https://ppdb.jatengprov.go.id
2. Buat akun dengan NIK dan data diri.
3. Pilih SMK Negeri 2 Surakarta sebagai sekolah tujuan.
4. Upload dokumen yang diperlukan dalam format PDF/JPG.
5. Pilih jurusan/kompetensi keahlian yang diminati (maksimal 2 pilihan).
6. Cetak bukti pendaftaran.
7. Lakukan verifikasi berkas ke sekolah sesuai jadwal.

## Kontak PPDB
- **Hotline PPDB:** (0271) 714901
- **WhatsApp:** 0812-XXXX-XXXX (akan diumumkan saat pendaftaran dibuka)
- **Email:** ppdb@smkn2surakarta.sch.id
- **Lokasi Posko PPDB:** Gedung Utama SMKN 2 Surakarta, Jl. LU. Adisucipto No. 33`,
  },
  {
    sourceName: "Fasilitas Sekolah SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Fasilitas SMKN 2 Surakarta

## Fasilitas Akademik
- **Laboratorium Komputer** — 5 ruang lab dengan 200+ unit PC terbaru
- **Bengkel RPL** — Dilengkapi server lokal dan environment pengembangan lengkap
- **Lab Jaringan (TJKT)** — Perangkat Cisco, MikroTik, fiber optic trainer
- **Studio DKV** — iMac, tablet grafis Wacom, studio foto mini
- **Studio Animasi** — Workstation rendering, green screen, motion capture area
- **Bengkel Pendingin (TPTU)** — Unit AC trainer, kulkas trainer, chiller simulator
- **Bengkel Listrik (TITL)** — Panel listrik, PLC trainer, simulasi instalasi industri

## Fasilitas Umum
- **Perpustakaan Digital** — 10.000+ koleksi buku dan e-book
- **Masjid Al-Hikmah** — Masjid 2 lantai untuk ibadah dan kegiatan keagamaan
- **Lapangan Olahraga** — Lapangan basket, voli, futsal, dan atletik
- **Kantin Sehat** — Kantin bersertifikat layak hygiene
- **Ruang UKS** — Dilengkapi tenaga medis tetap
- **Auditorium** — Kapasitas 500 orang untuk acara sekolah
- **Parking Area** — Area parkir luas untuk siswa dan guru

## Fasilitas Pendukung
- **WiFi Sekolah** — Koneksi internet fiber optic 1 Gbps
- **CCTV** — Sistem keamanan 24 jam
- **Taman Sekolah** — Area hijau untuk relaksasi dan belajar outdoor`,
  },
  {
    sourceName: "Ekstrakurikuler SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Kegiatan Ekstrakurikuler SMKN 2 Surakarta

## Wajib
- **Pramuka** — Kegiatan kepramukaan setiap Jumat sore

## Pilihan (Bidang Teknologi & Sains)
- **Robotika** — Pembuatan dan programming robot, sering ikut lomba tingkat nasional
- **Coding Club** — Komunitas programming, hackathon, dan competitive programming
- **IoT Lab** — Internet of Things, Arduino, Raspberry Pi
- **Cyber Security** — Ethical hacking, CTF (Capture The Flag) competition

## Pilihan (Bidang Seni & Kreativitas)
- **Seni Rupa & Digital Art** — Ilustrasi, lukis, dan seni digital
- **Film & Photography** — Produksi film pendek dan fotografi
- **Band & Musik** — Grup musik sekolah dan marching band

## Pilihan (Bidang Olahraga)
- **Futsal** — Tim futsal sekolah
- **Basket** — Tim basket putra dan putri
- **Bela Diri (Pencak Silat/Karate)** — Latihan bela diri
- **E-Sports** — Kompetisi game (Mobile Legends, Valorant)

## Pilihan (Bidang Kepemimpinan & Sosial)
- **Paskibra** — Pasukan Pengibar Bendera, sering tampil di upacara tingkat kota
- **PMR** — Palang Merah Remaja, kegiatan kemanusiaan
- **OSIS** — Organisasi Siswa Intra Sekolah
- **English Club** — Debat bahasa Inggris dan public speaking

## Prestasi Terbaru
- Juara 1 LKS Tingkat Provinsi Jawa Tengah (RPL) 2025
- Finalis Kompetisi Robotika Nasional 2025
- Juara 2 CTF Competition BSSN 2025
- Best Film Festival Pelajar Surakarta 2025`,
  },
  {
    sourceName: "Zona Pendaftaran PPDB SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Zona Pendaftaran PPDB SMKN 2 Surakarta

## Wilayah Prioritas (Zona 1)
Kecamatan yang masuk dalam zona prioritas:
- **Banjarsari** — Termasuk Kelurahan Manahan, Mangkubumen, Sumber, Nusukan, Kadipiro, Banyuanyar, Gilingan, Kestalan, Punggawan, Setabelan, Keprabon, Timuran
- **Laweyan** — Termasuk Kelurahan Pajang, Laweyan, Panularan, Sriwedari, Purwosari, Penumping, Kerten, Jajar, Karangasem, Bumi
- **Jebres** — Termasuk Kelurahan Jebres, Mojosongo, Tegalharjo, Pucangsawit, Jagalan, Gandekan, Sewu, Sudiroprajan, Kepatihan Wetan, Kepatihan Kulon, Purwodiningratan

## Wilayah Zona 2
- **Pasar Kliwon** — Seluruh kelurahan
- **Serengan** — Seluruh kelurahan

## Wilayah Luar Zona (Kabupaten Sekitar)
Calon siswa dari luar Kota Surakarta tetap bisa mendaftar melalui jalur Prestasi atau jalur lainnya:
- Kabupaten Karanganyar
- Kabupaten Sukoharjo
- Kabupaten Boyolali
- Kabupaten Sragen
- Kabupaten Klaten

## Ketentuan Zonasi
- Jarak domisili dihitung berdasarkan koordinat GPS dari alamat di Kartu Keluarga (KK).
- KK yang digunakan harus diterbitkan minimal 1 tahun sebelum tanggal pendaftaran.
- Pindah KK setelah pengumuman PPDB dianggap tidak sah.`,
  },
  {
    sourceName: "FAQ PPDB SMKN 2 Surakarta",
    sourceType: "text",
    content: `# Pertanyaan yang Sering Ditanyakan (FAQ) PPDB SMKN 2 Surakarta

## Q: Apakah PPDB SMKN 2 Surakarta gratis?
A: Ya, pendaftaran PPDB di SMKN 2 Surakarta sepenuhnya GRATIS. Tidak ada biaya pendaftaran apapun. Waspadai penipuan yang mengatasnamakan panitia PPDB.

## Q: Berapa kuota siswa baru tahun 2026?
A: Kuota penerimaan siswa baru tahun 2026 adalah sekitar 360-400 siswa yang terbagi dalam beberapa jurusan/kompetensi keahlian.

## Q: Apakah bisa mendaftar lebih dari satu jurusan?
A: Ya, calon siswa bisa memilih maksimal 2 (dua) pilihan jurusan pada saat pendaftaran. Pilihan pertama adalah prioritas utama.

## Q: Kapan pendaftaran online dibuka?
A: Pendaftaran online PPDB 2026 akan dibuka pada tanggal 2 Juni 2026 melalui website resmi PPDB Jawa Tengah di https://ppdb.jatengprov.go.id.

## Q: Apakah siswa dari luar Kota Solo bisa mendaftar?
A: Bisa! Siswa dari luar Kota Surakarta (Karanganyar, Sukoharjo, Boyolali, Sragen, Klaten, dll.) dapat mendaftar melalui jalur Prestasi atau jalur khusus lainnya.

## Q: Bagaimana jika belum punya ijazah saat mendaftar?
A: Jika ijazah belum keluar, bisa menggunakan Surat Keterangan Lulus (SKL) sementara dari sekolah asal. Ijazah asli diserahkan saat daftar ulang.

## Q: Apakah ada tes masuk?
A: Seleksi PPDB jalur zonasi berdasarkan jarak domisili. Untuk jalur prestasi, seleksi berdasarkan nilai rapor dan/atau sertifikat prestasi. Tidak ada ujian tulis khusus.

## Q: Berapa biaya SPP per bulan?
A: Sebagai sekolah negeri, SMKN 2 Surakarta mendapatkan dana BOS. Siswa tidak dipungut SPP bulanan. Namun, ada kontribusi sukarela untuk kegiatan pengembangan sekolah yang besarannya disepakati bersama komite sekolah.

## Q: Apakah ada asrama/kost untuk siswa dari luar kota?
A: SMKN 2 Surakarta tidak menyediakan asrama resmi. Namun, banyak kost-kostan terjangkau di sekitar sekolah dengan harga mulai dari Rp 300.000-Rp 600.000/bulan.

## Q: Di mana saya bisa mendapatkan info terbaru tentang PPDB?
A: Info terbaru bisa diakses melalui:
- Website: https://smkn2surakarta.sch.id
- Instagram: @smkn2surakarta.official
- Chatbot Kak Duta (Smakaduta.ai)
- Posko PPDB di sekolah`,
  },
];

/**
 * Parse CLI arguments.
 *
 * Supported flags:
 *   --force               → delete & reseed ALL documents
 *   --source="Nama Doc"   → delete & reseed specific document
 *   --list                → show all available seed documents
 *
 * Examples:
 *   pnpm db:seed                                    → seed only new docs
 *   pnpm db:seed --force                            → reseed everything
 *   pnpm db:seed --source="FAQ PPDB SMKN 2 Surakarta" → reseed one doc
 *   pnpm db:seed --list                             → list all docs
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const list = args.includes("--list");
  const sourceArg = args.find((a) => a.startsWith("--source="));
  const source = sourceArg ? sourceArg.replace("--source=", "").replace(/^"|"$/g, "") : null;
  return { force, list, source };
}

/**
 * Delete all chunks for a specific source name.
 */
async function deleteSource(sourceName: string) {
  await db.execute(sql`DELETE FROM resources WHERE source_name = ${sourceName}`);
}

/**
 * Seed a single document: chunk → embed → store.
 */
async function seedDocument(doc: { sourceName: string; sourceType: string; content: string }) {
  const chunks = chunkText(doc.content);
  console.log(`   📝 ${chunks.length} chunks akan diproses`);

  let processed = 0;
  let errors = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      const embeddingStr = `[${embedding.join(",")}]`;

      await db.execute(sql`
        INSERT INTO resources (content, source_name, source_type, chunk_index, embedding)
        VALUES (${chunk.content}, ${doc.sourceName}, ${doc.sourceType}, ${chunk.chunkIndex}, ${embeddingStr}::halfvec(2048))
      `);

      processed++;
      process.stdout.write(`   ✅ Chunk ${chunk.chunkIndex + 1}/${chunks.length}\r`);
    } catch (error: any) {
      errors++;
      console.error(`\n   ❌ Chunk ${chunk.chunkIndex}: ${error.message}`);
    }
  }

  console.log(`   ✅ Selesai! (${processed} berhasil, ${errors} error)`);
  return { processed, errors, total: chunks.length };
}

/**
 * Main seeder function with CLI support.
 */
async function seed() {
  const { force, list, source } = parseArgs();

  // --list: tampilkan semua dokumen yang tersedia
  if (list) {
    console.log("\n📚 Daftar Seed Documents yang Tersedia:\n");
    SEED_DOCUMENTS.forEach((doc, i) => {
      console.log(`  ${i + 1}. "${doc.sourceName}" [${doc.sourceType}]`);
    });
    console.log("\n💡 Gunakan --source=\"nama doc\" untuk reseed satu dokumen.");
    console.log("   Gunakan --force untuk reseed semua.\n");
    process.exit(0);
  }

  // Header
  const mode = force ? "🔥 FORCE RESEED SEMUA" : source ? `🎯 RESEED: "${source}"` : "🌱 SEED BARU";
  console.log(`\n${mode}\n${"─".repeat(50)}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local");
    process.exit(1);
  }

  // Ensure DB ready
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      source_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
      source_type VARCHAR(50) NOT NULL DEFAULT 'text',
      chunk_index INTEGER NOT NULL DEFAULT 0,
      embedding halfvec(2048),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS resources_embedding_idx
    ON resources
    USING hnsw (embedding halfvec_cosine_ops)
  `);

  // Tentukan dokumen yang akan diproses
  let docsToProcess = SEED_DOCUMENTS;

  if (source) {
    // --source: hanya proses dokumen yang namanya cocok
    docsToProcess = SEED_DOCUMENTS.filter((d) =>
      d.sourceName.toLowerCase().includes(source.toLowerCase())
    );

    if (docsToProcess.length === 0) {
      console.error(`❌ Tidak ada dokumen dengan nama mengandung: "${source}"`);
      console.log("   Jalankan --list untuk melihat daftar dokumen.\n");
      process.exit(1);
    }

    // Delete existing chunks for this source
    for (const doc of docsToProcess) {
      console.log(`🗑️  Menghapus data lama: "${doc.sourceName}"`);
      await deleteSource(doc.sourceName);
    }
  } else if (force) {
    // --force: hapus semua dan reseed
    console.log("🗑️  Menghapus semua data lama...");
    await db.execute(sql`TRUNCATE TABLE resources`);
    console.log("✅ Data lama dihapus!\n");
  }

  let totalChunks = 0;
  let totalProcessed = 0;
  let totalErrors = 0;

  for (const doc of docsToProcess) {
    console.log(`\n📄 Processing: ${doc.sourceName}`);

    // Skip if already exists (only in normal mode, not force/source mode)
    if (!force && !source) {
      const existing = await db.execute<{ count: string }>(
        sql`SELECT COUNT(*)::text as count FROM resources WHERE source_name = ${doc.sourceName}`
      );
      if (Number(existing.rows[0]?.count) > 0) {
        console.log(`   ⏭️  Sudah ada, skip. (gunakan --force atau --source untuk update)`);
        continue;
      }
    }

    const result = await seedDocument(doc);
    totalChunks += result.total;
    totalProcessed += result.processed;
    totalErrors += result.errors;
  }

  console.log("\n" + "═".repeat(50));
  console.log(`🎉 Seeding selesai!`);
  console.log(`   📊 Total chunks: ${totalChunks}`);
  console.log(`   ✅ Berhasil: ${totalProcessed}`);
  if (totalErrors > 0) console.log(`   ❌ Error: ${totalErrors}`);
  console.log("═".repeat(50) + "\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeder gagal:", error);
  process.exit(1);
});
