# SawitPupuk — Website Statis Kalkulator Pemupukan Kelapa Sawit

## Fitur
- Registrasi dan login demo di browser.
- Kalkulator kebutuhan pupuk (dosis kg/pokok × jumlah pokok).
- Estimasi biaya berdasarkan harga pupuk per kg.
- Beberapa jenis pupuk dan input dosis/harga yang bisa disesuaikan.
- Penyimpanan catatan per pengguna menggunakan `localStorage`.
- Lihat rincian, cari catatan, hapus catatan, dan ekspor CSV.
- Responsive untuk ponsel Android, tablet, dan desktop.

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka `index.html` menggunakan browser modern.
3. Daftar akun lalu masuk dan mulai menggunakan kalkulator.

Tidak perlu instalasi server atau koneksi internet untuk fitur utama.

## Catatan penting
- Ini adalah website statis/demo. Registrasi bukan autentikasi server; nama pengguna, kata sandi, dan catatan disimpan di browser/perangkat yang sama melalui `localStorage`.
- Jangan gunakan kata sandi penting/yang dipakai di akun lain.
- Menghapus data situs/browser dapat menghapus catatan lokal. Catatan tidak otomatis tersinkron antarperangkat.
- Estimasi jumlah pokok default adalah 143 pokok/ha jika jumlah pokok tidak diisi. Silakan ubah sesuai jarak tanam/kondisi kebun.
- Dosis pupuk bawaan hanyalah contoh awal untuk memudahkan pengujian. Sesuaikan dengan rekomendasi penyuluh/agronom, umur tanaman, analisis tanah/daun, dan kondisi setempat. Kalkulator bukan alat penentu dosis agronomis.
- Harga pupuk bawaan hanya contoh dan perlu diganti dengan harga aktual.
