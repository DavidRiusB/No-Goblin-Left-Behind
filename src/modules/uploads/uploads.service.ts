import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: userId, // one avatar per user — overwrites on re-upload
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result)
            return reject(new InternalServerErrorException('Upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  async uploadBadgeIcon(
    file: Express.Multer.File,
    id: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'badges',
          public_id: id,
          overwrite: true,
          transformation: [
            { width: 128, height: 128, crop: 'fit' }, // fit, not fill — don't crop icons
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result)
            return reject(new InternalServerErrorException('Upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }
}
