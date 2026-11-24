# CBT Tryout MAN Insan Cendekia (5 Paket - 1.370 Soal)

Aplikasi web simulasi ujian **Computer-Based Test (CBT)** Seleksi Nasional Peserta Didik Baru (SNPDB) MAN Insan Cendekia berbasis **100% Client-Side Static Website** (tanpa database SQL/server backend), sehingga dapat di-hosting secara gratis dan instan di **GitHub Pages**, **Netlify**, **Vercel**, atau web server lokal (Laragon/XAMPP/Live Server).

---

## 🚀 Fitur Unggulan

1. **Bank Soal Lengkap 5 Paket (1.370 Soal Asli)**
   - Diekstrak langsung dari ebook resmi 5 paket soal dan pembahasan MAN IC.
   - Terdiri dari 7 kategori mata uji standar SNPDB:
     1. **Kemampuan Verbal** (40 soal per paket)
     2. **Literasi Bahasa Indonesia** (26 soal per paket)
     3. **Bahasa Inggris** (20 soal per paket)
     4. **Keislaman** (25 soal per paket)
     5. **Matematika** (58 soal per paket)
     6. **Moderasi Beragama dan Sikap** (70 soal per paket)
     7. **Angket Sikap & Karakter** (35 soal per paket)
   - Total 274 soal per paket × 5 paket = **1.370 soal** lengkap dengan opsi A-D, kunci jawaban resmi, dan pembahasan mendalam (Dasar Teori, Cara Mengerjakan per langkah, dan Kesimpulan).

2. **Soal Teracak Otomatis (Shuffle Engine)**
   - Setiap kali memulai tryout, urutan soal diacak secara otomatis menggunakan algoritma *Fisher-Yates Shuffle*.

3. **Kuis Cepat Proporsional (Quick Quiz)**
   - Dirancang bagi siswa yang ingin latihan kilat tanpa harus mengerjakan 274 soal sekaligus.
   - Pilihan panjang kuis: **20 soal (~15 menit)**, **35 soal (~25 menit)**, atau **50 soal (~40 menit)**.
   - **Proporsi kategori soal dipertahankan persis** sesuai proporsi ujian asli:
     - Kemampuan Verbal: ~14.6%
     - Literasi Bahasa Indonesia: ~9.5%
     - Bahasa Inggris: ~7.3%
     - Keislaman: ~9.1%
     - Matematika: ~21.2%
     - Moderasi Beragama dan Sikap: ~25.5%
     - Angket Sikap: ~12.8%
   - Sumber soal bisa diambil dari paket tertentu atau **campuran acak dari seluruh 1.370 bank soal**.

4. **Latihan Mandiri per Kategori (Drill Practice)**
   - Memungkinkan siswa memilih satu bidang spesifik (misal: hanya Matematika atau hanya Keislaman) untuk mengasah kelemahan mereka.

5. **Antarmuka Ujian CBT Realistis**
   - Panel navigasi nomor soal dengan kode warna interaktif:
     - 🟩 **Hijau**: Sudah dijawab
     - 🟨 **Kuning**: Ragu-ragu (Bookmark)
     - ⬜ **Abu-abu**: Belum dijawab
     - 🟦 **Border Biru**: Soal yang sedang aktif dibuka
   - Timer hitung mundur dengan peringatan visual saat waktu sisa < 5 menit.
   - Pengatur ukuran font (A-, A, A+) untuk kenyamanan membaca teks panjang.
   - Modal rekapitulasi sebelum submit (mencegah soal tidak sengaja terlewat).

6. **Laporan Skor & Diagnosis Kelemahan (Diagnostic Report)**
   - Menghitung akurasi, skor akhir, jumlah benar, salah, dan kosong.
   - Menampilkan visual progress bar performa per kategori materi, sehingga siswa langsung tahu mata pelajaran mana yang nilainya masih rendah.

7. **Penyimpanan Seluruh Riwayat & Review Pembahasan**
   - Riwayat tersimpan secara otomatis di browser (`localStorage`).
   - Fitur **Review Pembahasan Rinci**: melihat lembar jawaban yang telah dikerjakan, membandingkan jawaban siswa vs kunci resmi, dilengkapi filter (*Semua Soal*, *Hanya Jawaban Salah*, *Hanya Jawaban Benar*, *Tidak Terjawab*).
   - Fitur **Backup (Export JSON)** dan **Restore (Import JSON)**: riwayat ujian dapat di-download ke file JSON dan di-upload kembali jika ingin berganti perangkat / browser.

8. **Tampilan Modern & Ramah Mata**
   - Mode Gelap (Dark Mode) dan Mode Terang (Light Mode).
   - Desain responsif di layar Smartphone, Tablet, maupun Laptop/PC.

---

## 📂 Struktur Berkas

```
testmanpakfaisal/
├── index.html                 # Halaman utama aplikasi (SPA)
├── css/
│   └── app.css                # Kustomisasi CSS, tema CBT & animasi
├── js/
│   └── app.js                 # Logika CBT, randomizer, kuis cepat, storage & review
├── data/
│   ├── summary.json           # Manifest bank soal & distribusi kategori
│   ├── paket1.json            # 274 Soal + Pembahasan Paket 1
│   ├── paket2.json            # 274 Soal + Pembahasan Paket 2
│   ├── paket3.json            # 274 Soal + Pembahasan Paket 3
│   ├── paket4.json            # 274 Soal + Pembahasan Paket 4
│   └── paket5.json            # 274 Soal + Pembahasan Paket 5
├── extract_dataset.py         # Skrip Python ekstraktor PDF ke JSON
├── enrich_dataset.py          # Skrip Python pelengkap opsi & rumus
└── README.md                  # Dokumentasi & panduan deployment
```

---

## 🌐 Cara Hosting & Menjalankan

### A. Hosting di GitHub Pages (Gratis)
1. Buat repositori baru di GitHub (misal: `tryout-man-ic`).
2. Push seluruh file di folder ini ke branch `main`.
3. Buka tab **Settings** repositori GitHub > **Pages**.
4. Pada bagian **Build and deployment**, pilih Source: **Deploy from a branch**, Branch: `main` / `(root)`.
5. Klik **Save**. Dalam 1-2 menit, website aktif di `https://username.github.io/tryout-man-ic/`.

### B. Hosting di Netlify (Gratis)
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
2. Tarik (drag & drop) folder `testmanpakfaisal` ke halaman Netlify Drop.
3. Website langsung aktif dan dapat diakses publik secara instan.

### C. Menjalankan di Lokal
- **Via Laragon/XAMPP**: Simpan folder di `C:/laragon/www/testmanpakfaisal` dan buka `http://localhost/testmanpakfaisal/`.
- **Via Python**:
  ```bash
  python -m http.server 8000
  ```
  Buka `http://localhost:8000/` di browser.

---

## 💡 Masukan & Rekomendasi Fitur Lanjutan

Berdasarkan analisis kebutuhan tryout seleksi SNPDB MAN Insan Cendekia, berikut beberapa saran pengembangan lebih lanjut yang bisa ditambahkan:

1. **Sistem Penilaian Bobot / IRT (Item Response Theory)**:
   - SNPDB dan UTBK kerap menggunakan pembobotan soal (soal yang jarang dijawab benar oleh peserta bernilai lebih tinggi). Kita dapat menambahkan opsi sistem skor standar (+4 benar, -1 salah, 0 kosong) atau sistem IRT sederhana.
2. **Audio Suara Ujian & Efek Realistis (Ambient CAT)**:
   - Efek suara detak jam di menit-menit akhir dan suara lonceng selesai untuk membiasakan ketenangan psikologis siswa menghadapi ujian sesungguhnya.
3. **PWA (Progressive Web App) dengan Service Worker**:
   - Menambahkan file `manifest.webmanifest` dan `sw.js` agar web dapat di-*Install as App* di HP Android/iOS/Windows dan bisa dikerjakan secara offline tanpa kuota internet sama sekali.
4. **Grafik Perkembangan Belajar (Learning Curve Graph)**:
   - Menambahkan diagram grafik garis skor dari waktu ke waktu (menggunakan Chart.js) pada tab Riwayat untuk memantau apakah grafik nilai siswa mengalami tren kenaikan setelah berkali-kali tryout.
5. **Mode Pembahasan Langsung (Flashcard / Instant Mode)**:
   - Selain mode tryout yang hasilnya muncul di akhir, sediakan mode "Latihan Cepat" di mana siswa langsung bisa melihat apakah jawabannya benar/salah beserta pembahasannya tepat setelah mereka mengklik opsi jawaban.
