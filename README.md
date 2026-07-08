# Otomatisasi Perapihan Google Drive dengan Google Apps Script

Script ini adalah solusi otomatisasi berbasis Google Apps Script (GAS) untuk merapikan, memetakan, dan mengklasifikasikan file di Google Drive yang berantakan, khususnya untuk memisahkan file pribadi dengan file yang dibagikan oleh pihak luar (Shared with me).

Script ini dirancang dengan sistem Looping Berantai (Time-driven Trigger) untuk mengatasi batas maksimal waktu eksekusi (timeout) 6 menit dari Google, sehingga aman digunakan untuk Google Drive.

🌟 Fitur Utama
1. Pembuatan Direktori Otomatis: Otomatis membuat folder induk "File Dari Luar" dan "File Format Google" di root Drive.
2. Database Pemetaan (Mapping): Otomatis membuat log di Google Spreadsheet yang mencatat Nama File, Ukuran, Lokasi Asli (Path), URL, Status Kepemilikan, dan Tindakan Sistem.
3. Auto-Bypass Limit Eksekusi: Berjalan secara batch selama 5,5 menit, menyimpan Continuation Token, berhenti sementara, dan dilanjutkan secara otomatis 1 menit kemudian hingga seluruh Drive selesai diproses.
4. Smart Export & Copy: * Mengekspor file Shared with me berformat Google (Docs, Sheets, Slides) menjadi format Office Desktop (.docx, .xlsx, .pptx) lalu menyimpannya di folder khusus.
- Membuat Shortcut (jalan pintas) otomatis untuk format web murni (Google Forms, Sites, Maps) yang tidak bisa dipindahkan secara konvensional.

🛠️ Persyaratan
1. Akun Google (Personal atau Workspace).
2. Akses ke Google Apps Script.

🚀 Cara Instalasi & Penggunaan
1. Memasang Script
- Buka Google Apps Script dan buat New Project (Proyek Baru).
- Beri nama proyek Anda, misalnya Perapihan GDrive.
- Salin seluruh kode yang ada di file Code.gs (atau salin dari repositori ini) dan tempelkan ke dalam editor Apps Script. Hapus kode bawaan function myFunction() {}.
- Klik tombol Save (Simpan) berikon disket di bagian atas.
2. Menjalankan Proses Pertama Kali
- Pada menu dropdown di sebelah kanan tombol Run (Jalankan), pilih fungsi mulaiProsesSistematis. ⚠️ PENTING: Pastikan Anda memilih mulaiProsesSistematis untuk eksekusi pertama, BUKAN prosesSebagian.
- Klik tombol Run.
- Google akan meminta otorisasi akses. Klik Review Permissions -> Pilih Akun Google Anda -> Klik Advanced (Lanjutan) -> Klik Go to Untitled project (unsafe) -> Pilih Allow (Izinkan).
- Biarkan script berjalan selama beberapa detik hingga indikator log menunjukkan proses sedang berjalan. Setelah itu, Anda bisa menutup tab browser. Script akan bekerja secara otonom di background server Google.

⚙️ Cara Kerja Sistem (Logika Kondisi)
Script akan memindai seluruh file dan memprosesnya dengan aturan berikut:
1. File Format Web (Form, Sites, Maps, Vids):
- Pindah langsung ke "File Format Google". Jika file bukan milik sendiri, script akan membuatkan Shortcut (Jalan Pintas) di folder tersebut.
2. File Milik Orang Lain (Shared with me):
- Jika berupa Google Docs/Sheets/Slides: Dikonversi ke .docx/.xlsx/.pptx dan disimpan ke "File Dari Luar".
- Jika berupa PDF/JPG/File lainnya: Disalin langsung ke "File Dari Luar".
3. File Milik Pribadi:
- Jika berupa format bawaan Google: Dipindahkan ke "File Format Google".
- Jika berupa format non-Google: Dibiarkan di lokasi aslinya.

⚠️ Penyelesaian Masalah (Troubleshooting)
Karena script memproses data massal di ekosistem Cloud, Anda mungkin akan menemui kendala dari sisi server Google:
1. Error Code: INTERNAL (Timeout paksa) : Jika pada tab Executions (Eksekusi) Anda melihat status Failed/Gagal dengan keterangan Error code INTERNAL karena durasi mencapai batas maksimal server (biasanya tepat 420 detik):
- Buka kembali Editor script.
- Ubah dropdown fungsi menjadi prosesSebagian.
- Klik Run SATU KALI SAJA.
- Script akan otomatis membaca memori file terakhir yang belum diproses dan melanjutkan siklus looping seperti semula.
2. Trigger (Pemicu) Berstatus Nonaktif (Disabled) : Ini terjadi jika Anda menekan tombol Run berkali-kali saat proses otomatis di latar belakang masih berjalan, sehingga dianggap spam oleh Google.
Solusi: Buka menu Triggers (ikon jam alarm), hapus semua pemicu yang berstatus dinonaktifkan, lalu jalankan fungsi prosesSebagian secara manual satu kali untuk menghidupkan kembali siklusnya.

📝 Lisensi
Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan personal maupun organisasi. Harap selalu lakukan pengujian terlebih dahulu pada akun cadangan (dummy) untuk memastikan skema perpindahan file sesuai dengan kebutuhan Anda.
