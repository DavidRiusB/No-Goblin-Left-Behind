import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TableMembership } from './entities/table-membership.entity';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { Table } from './entities/table.entity';

@Injectable()
export class TableMembershipRepository {
  constructor(
    @InjectRepository(TableMembership)
    private readonly membershipRepository: Repository<TableMembership>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TableMembership> {
    return manager
      ? manager.getRepository(TableMembership)
      : this.membershipRepository;
  }

  async create(
    data: { userId: string; tableId: string },
    manager?: EntityManager,
  ): Promise<TableMembership> {
    const repo = this.getRepo(manager);
    try {
      const membership = repo.create({
        user: { id: data.userId } as User,
        table: { id: data.tableId } as Table,
      });
      return await repo.save(membership);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create membership');
    }
  }
}
