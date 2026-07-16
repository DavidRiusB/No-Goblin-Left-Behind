import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Table } from './entities/table.entity';
import { EntityManager, Repository } from 'typeorm';

import { TableStatus } from 'src/common/enums/table-status.enum';
import { FindTablesDto } from './dtos/find-table.dto';
import { MembershipStatus } from 'src/common/enums/membership-status.enum';
import { CreateTableDto } from './dtos/create-table.dto';
import { User } from '../users/entity/user.entity';

@Injectable()
export class TableRepository {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Table> {
    return manager ? manager.getRepository(Table) : this.tableRepository;
  }

  async findWithFilters(
    filters: FindTablesDto,
    manager?: EntityManager,
  ): Promise<{ data: Table[]; total: number }> {
    const repo = this.getRepo(manager);

    const query = repo
      .createQueryBuilder('table')
      .leftJoinAndSelect('table.dm', 'dm')
      .loadRelationCountAndMap(
        'table.activeMemberCount',
        'table.memberships',
        'member',
        (qb) =>
          qb.where('member.status = :activeStatus', {
            activeStatus: MembershipStatus.ACTIVE,
          }),
      )
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(*)')
          .from('table_memberships', 'tm')
          .where('tm.table_id = table.id')
          .andWhere('tm.status = :activeStatus')
          .getQuery();
        return `table.seatsTotal > ${subQuery}`;
      })
      .andWhere('table.status = :status', { status: TableStatus.OPEN })
      .andWhere('table.bannedAt IS NULL')
      .andWhere('dm.bannedAt IS NULL')
      .setParameter('activeStatus', MembershipStatus.ACTIVE);

    if (filters.system) {
      query.andWhere('table.system ILIKE :system', {
        system: `%${filters.system}%`,
      });
    }

    if (filters.language) {
      query.andWhere('table.language ILIKE :language', {
        language: `%${filters.language}%`,
      });
    }

    if (filters.isOnline !== undefined) {
      query.andWhere('table.isOnline = :isOnline', {
        isOnline: filters.isOnline,
      });
    }

    if (filters.ageRequirement) {
      query.andWhere('table.ageRequirement = :ageRequirement', {
        ageRequirement: filters.ageRequirement,
      });
    }

    if (filters.tableType) {
      query.andWhere('table.tableType = :tableType', {
        tableType: filters.tableType,
      });
    }

    if (filters.platform) {
      query.andWhere('table.platform ILIKE :platform', {
        platform: `%${filters.platform}%`,
      });
    }

    if (filters.location) {
      query.andWhere('table.location ILIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    if (filters.from) {
      query.andWhere('table.scheduledAt >= :from', { from: filters.from });
    }

    if (filters.to) {
      query.andWhere('table.scheduledAt <= :to', { to: filters.to });
    }

    if (filters.recurrence) {
      query.andWhere('table.recurrence = :recurrence', {
        recurrence: filters.recurrence,
      });
    }
    if (filters.experienceLevel) {
      query.andWhere('table.experienceLevel =:experienceLevel ', {
        experienceLevel: filters.experienceLevel,
      });
    }

    query
      .orderBy('table.scheduledAt', 'ASC')
      .skip(((filters.page ?? 1) - 1) * (filters.limit ?? 20))
      .take(filters.limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async findById(id: string, manager?: EntityManager): Promise<Table | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({
      where: { id },
      relations: { dm: true },
    });
  }

  // table + dm + members (with their user). for the detail view.
  async findByIdWithMembers(id: string): Promise<Table | null> {
    return this.tableRepository.findOne({
      where: { id },
      relations: {
        dm: true,
        memberships: { user: true },
      },
    });
  }

  async create(
    data: CreateTableDto,
    dm: User,
    manager?: EntityManager,
  ): Promise<Table> {
    const repo = this.getRepo(manager);
    try {
      const table = repo.create({ ...data, dm });
      return await repo.save(table);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create table');
    }
  }

  async update(table: Table, manager?: EntityManager): Promise<Table> {
    const repo = this.getRepo(manager);
    try {
      return await repo.save(table);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to update table');
    }
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.softDelete(id);
  }

  async findByDm(userId: string, manager?: EntityManager): Promise<Table[]> {
    const repo = this.getRepo(manager);
    return repo.find({
      where: { dm: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
