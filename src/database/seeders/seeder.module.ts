import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from 'src/config/database.config';
import { User } from 'src/modules/users/entity/user.entity';
import { SeederService } from './seeder.service';
import { Module } from '@nestjs/common';
import { Credential } from 'src/modules/auth/entity/auth.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { JoinRequest } from 'src/modules/tables/entities/join-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => databaseConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Credential,
      Table,
      TableMembership,
      JoinRequest,
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
