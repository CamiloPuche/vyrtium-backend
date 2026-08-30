import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { AppError } from '../errors/AppError';
import { logger } from './logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'vyrtium/products'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      logger.warn('Cloudinary no configurado completamente; se requiere configuración');
      return reject(
        new AppError(500, 'Servicio de imágenes Cloudinary no configurado', false)
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          logger.error({ err: error }, 'Fallo en la subida a Cloudinary');
          return reject(
            new AppError(500, 'Error al subir la imagen al servidor de medios', false)
          );
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
