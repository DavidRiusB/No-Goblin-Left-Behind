import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JoinRequest } from './entities/join-request.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { JoinRequestStatus } from 'src/common/enums/join-request-status-enum';
import { User } from '../users/entity/user.entity';
import { Table } from './entities/table.entity';

@Injectable()
export class JoinRequestRepository {
  constructor(
    @InjectRepository(JoinRequest)
    private readonly joinRequestRepository: Repository<JoinRequest>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<JoinRequest> {
    return manager
      ? manager.getRepository(JoinRequest)
      : this.joinRequestRepository;
  }

  async findExisting(
    userId: string,
    tableId: string,
    manager?: EntityManager,
  ): Promise<JoinRequest | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({
      where: {
        user: { id: userId },
        table: { id: tableId },
        status: In([JoinRequestStatus.PENDING, JoinRequestStatus.APPROVED]),
      },
    });
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<JoinRequest | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({
      where: { id },
      relations: { table: { dm: true }, user: true },
    });
  }

  async findByUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<JoinRequest[]> {
    const repo = this.getRepo(manager);
    return repo.find({
      where: { user: { id: userId } },
      relations: { table: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingByTable(
    tableId: string,
    manager?: EntityManager,
  ): Promise<JoinRequest[]> {
    const repo = this.getRepo(manager);
    return repo.find({
      where: {
        table: { id: tableId },
        status: JoinRequestStatus.PENDING,
      },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByTable(
    tableId: string,
    manager?: EntityManager,
  ): Promise<JoinRequest[]> {
    const repo = this.getRepo(manager);
    return repo.find({
      where: { table: { id: tableId } },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findUserIdsByTable(
    tableId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const repo = this.getRepo(manager);
    const rows = await repo
      .createQueryBuilder('r')
      .select('user.id', 'userId')
      .innerJoin('r.user', 'user')
      .where('r.table = :tableId', { tableId })
      .getRawMany<{ userId: string }>();
    return rows.map((r) => r.userId);
  }

  async create(
    data: { userId: string; tableId: string; message?: string },
    manager?: EntityManager,
  ): Promise<JoinRequest> {
    const repo = this.getRepo(manager);
    try {
      const request = repo.create({
        user: { id: data.userId } as User,
        table: { id: data.tableId } as Table,
        message: data.message,
      });
      return await repo.save(request);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create join request');
    }
  }

  async updateStatus(
    request: JoinRequest,
    status: JoinRequestStatus,
    manager?: EntityManager,
  ): Promise<JoinRequest> {
    const repo = this.getRepo(manager);
    request.status = status;
    return repo.save(request);
  }
}
