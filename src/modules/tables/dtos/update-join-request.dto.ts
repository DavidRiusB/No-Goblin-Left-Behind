import { IsEnum } from 'class-validator';
import { JoinRequestStatus } from 'src/common/enums/join-request-status-enum';

export class UpdateJoinRequestDto {
  @IsEnum(JoinRequestStatus, { message: 'Invalid status' })
  status!: JoinRequestStatus.APPROVED | JoinRequestStatus.REJECTED;
}
