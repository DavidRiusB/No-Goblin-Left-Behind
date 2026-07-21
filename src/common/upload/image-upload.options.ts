import { BadRequestException } from '@nestjs/common';

export const imageUploadOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(
      file.mimetype,
    );
    cb(ok ? null : new BadRequestException('Only JPEG, PNG, or WebP'), ok);
  },
};
