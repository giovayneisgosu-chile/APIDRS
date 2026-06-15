import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key:    config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async subirPdf(buffer: Buffer, carpeta: string, nombreArchivo: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const publicId = nombreArchivo.replace('.pdf', '');
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', format: 'pdf', folder: carpeta, public_id: publicId },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Sin resultado de Cloudinary'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
