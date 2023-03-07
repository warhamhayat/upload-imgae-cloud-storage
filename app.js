const express = require('express');
const fileUpload = require('express-fileupload');
const { Storage } = require('@google-cloud/storage');
const path = require ('path')
const serviceKey = path.join(__dirname, './key.json')
const app = express();

// Middleware untuk mengaktifkan file upload
app.use(fileUpload());

// Konfigurasi Google Cloud Storage
const storage = new Storage({
  projectId: 'learn-cloudrepository', // Ganti dengan ID proyek Anda
  keyFilename: serviceKey // Ganti dengan lokasi file kunci Anda
});
const bucketName = 'belajar-cc17'; // Ganti dengan nama bucket Anda

// Route untuk mengunggah file
app.post('/upload', async (req, res) => {
  try {
    // Ambil file dari request
    const file = req.files.image;

    // Upload file ke Google Cloud Storage
    const fileName = `${Date.now()}_${file.name}`;
    const fileUpload = storage.bucket(bucketName).file(fileName);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });
    stream.on('error', err => {
      console.error(err);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file' });
    });
    stream.on('finish', async () => {
      console.log(`File ${fileName} berhasil diunggah ke Google Cloud Storage`);
      const url = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-09-2024' // Ganti dengan tanggal kedaluwarsa yang Anda inginkan
      });
      res.json({ message: 'File berhasil diunggah ke Google Cloud Storage', url : url  });
    });

    stream.end(file.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file' });
  }
});

// Jalankan aplikasi pada port tertentu
app.listen(3000, () => {
  console.log('Aplikasi berjalan pada port 3000');
});
