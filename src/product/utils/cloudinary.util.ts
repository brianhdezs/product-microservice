import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import { validateImageContent } from './sightengine.util';
dotenv.config();

// === CONFIG CLOUDINARY ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === SUBIDA A CLOUDINARY CON FILTRO SIGHTENGINE ===
export async function uploadToCloudinary(filePath: string): Promise<string> {
  try {
    // 🧠 Primero valida la imagen con Sightengine
    const isSafe = await validateImageContent(filePath);
    if (!isSafe) {
      throw new Error('IMAGEN RECHAZADA: contiene contenido sensible o violento.');
    }

    // ☁️ Si pasa la validación, súbela a Cloudinary
    const res: any = await cloudinary.uploader.upload(filePath, {
      folder: 'products',
    });

    return res.secure_url;
  } catch (err: any) {
    throw new Error('Error al subir imagen a Cloudinary: ' + err.message);
  }
}
