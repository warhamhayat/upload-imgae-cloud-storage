const express = require('express');
const ObsClient = require('esdk-obs-nodejs');
const multer = require('multer');
require('dotenv').config();
const stream = require('stream');

const app = express();
app.use(express.json()); // Untuk menangani request body dengan format JSON
app.use(express.urlencoded({ extended: true }));

// Konfigurasi Multer untuk menangani upload file tanpa menyimpan di memori atau disk
const upload = multer(); // Tidak menggunakan penyimpanan di memori atau disk

// Inisialisasi Huawei OBS Client
const obsClient = new ObsClient({
  access_key_id: process.env.ACCESS_KEY_ID,
  secret_access_key: process.env.SECRET_ACCESS_KEY,
  server: process.env.OBS_ENDPOINT
});

const bucketName = process.env.BUCKET; // Nama bucket
const region = 'ap-southeast-4'; // Ganti dengan wilayah OBS Anda

// Route untuk menangani upload file tunggal
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log(req.file)
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    const file = req.file;
    console.log('File yang diunggah:', file);

    const fileName = `${Date.now()}_${file.originalname}`;

    // Buat Readable stream dari buffer
    const readStream = new stream.PassThrough();
    readStream.end(file.buffer);

    // Upload file ke Huawei OBS menggunakan stream
    obsClient.putObject({
      Bucket: bucketName,
      Key: `folder/${fileName}`, // Anda bisa mengganti 'folder/' sesuai kebutuhan
      Body: readStream, // Menggunakan stream dari buffer
      ContentLength: file.size, // Ukuran file
      ContentType: file.mimetype // Tipe konten
    }, (err, result) => {
      if (err) {
        console.error('Error saat mengunggah file:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file', error: err.message });
      }

      // Membuat URL file yang diunggah
      const url = `https://${bucketName}.obs.${region}.myhuaweicloud.com/folder/${fileName}`;

      res.json({
        message: 'File berhasil diunggah ke Huawei OBS',
        url: url,
        status: res.statusCode
      });

      console.log(`File ${fileName} berhasil diunggah ke Huawei OBS`);
    });
  } catch (err) {
    console.error('Error saat mengunggah file:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file', error: err.message });
  }
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Aplikasi berjalan di port ${port}`);
});
