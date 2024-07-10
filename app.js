const express = require('express');
const fileUpload = require('express-fileupload');
const ObsClient = require('esdk-obs-nodejs');
const path = require('path');
const fs = require('fs')
require('dotenv').config();

const app = express();

app.use(fileUpload());

// init to huwaei
const obsClient = new ObsClient({
  access_key_id: process.env.ACCESS_KEY_ID,
  secret_access_key: process.env.SECRET_ACCESS_KEY,
  server: process.env.OBS_ENDPOINT
});

const bucketName = process.env.BUCKET; // buckend name
const region = 'ap-southeast-4'; // Ganti dengan wilayah OBS Anda

// Route untuk menangani upload file
app.post('/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    //get filee from client
    const file = req.files.image;
    //add time date to image name
    const fileName = `${Date.now()}_${file.name}`;

    const imagePath = path.join(
      __dirname,
      './upload/' + `${fileName}`
    );


    await file.mv(imagePath);
    // Upload file ke Huawei OBS
    const result = await obsClient.putObject({
      Bucket: bucketName,
      Key: fileName,
      // Body: file.data,
      // ContentType: file.mimetype
      SourceFile : imagePath
    });

    //delete image in local directory 
    fs.unlinkSync(imagePath)

    // await fs.unlink(imagePath);
    if (result.CommonMsg.Status < 300) {
      console.log(`File ${fileName} berhasil diunggah ke Huawei OBS`);
      const url = `https://${bucketName}.obs.${region}.myhuaweicloud.com/${fileName}`;
      res.json({ message: 'File berhasil diunggah ke Huawei OBS', url: url });
    } else {
      console.error(result.CommonMsg);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file' });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Aplikasi berjalan di port ${port}`);
});
