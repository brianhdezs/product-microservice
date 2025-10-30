import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import * as dotenv from 'dotenv';
dotenv.config();

const API_USER = process.env.SIGHTENGINE_USER;
const API_SECRET = process.env.SIGHTENGINE_SECRET;

/**
 * Valida una imagen usando Sightengine (detecta desnudos, violencia, gore, armas, insultos, etc.)
 */
export async function validateImageContent(filePath: string): Promise<boolean> {
  try {
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    // modelos: nudity (desnudos), wad (armas, alcohol, drogas), offensive (texto ofensivo), gore, violence
    form.append('models', 'nudity-2.1,wad,offensive,gore,violence');
    form.append('api_user', API_USER);
    form.append('api_secret', API_SECRET);

    const response = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
      headers: form.getHeaders(),
    });

    const data = response.data;

    const nudity = data.nudity?.sexual_activity || 0;
    const sexualDisplay = data.nudity?.sexual_display || 0;
    const weapon = data.weapon?.prob || 0;
    const alcohol = data.alcohol?.prob || 0;
    const drugs = data.drugs?.prob || 0;
    const offensive = data.offensive?.prob || 0;
    const violence = data.violence?.prob || 0;
    const gore = data.gore?.prob || 0;

    // 🚫 umbral más estricto: 0.2 (20%)
    const isUnsafe =
      nudity > 0.5 ||
      sexualDisplay > 0.5 ||
      weapon > 0.5 ||
      alcohol > 0.5 ||
      drugs > 0.5 ||
      offensive > 0.5 ||
      violence > 0.5 ||
      gore > 0.5;

    return !isUnsafe;
  } catch (err: any) {
    console.error('Error validando imagen con Sightengine:', err.response?.data || err.message);
    throw new Error('Error al validar imagen con Sightengine: ' + err.message);
  }
}
