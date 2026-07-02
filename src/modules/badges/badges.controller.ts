import { Controller, Get } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { plainToInstance } from 'class-transformer';
import { BadgeResponse } from './dtos/badge-response.dto';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  async findAll() {
    const badges = await this.badgesService.getAllActive();
    return plainToInstance(BadgeResponse, badges, {
      excludeExtraneousValues: true,
    });
  }
}
