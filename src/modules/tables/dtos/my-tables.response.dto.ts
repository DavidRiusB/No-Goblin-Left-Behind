import { Expose, Type } from 'class-transformer';

class PublicUserResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
}

class MyTableResponse {
  @Expose() id!: string;
  @Expose() title!: string;
  @Expose() system!: string;
  @Expose() tableType!: string;
  @Expose() status!: string;
  @Expose() @Type(() => PublicUserResponse) dm!: PublicUserResponse;
}

class MyMembershipResponse {
  @Expose() id!: string;
  @Expose() status!: string;
  @Expose() @Type(() => MyTableResponse) table!: MyTableResponse;
}

class MyJoinRequestResponse {
  @Expose() id!: string;
  @Expose() status!: string;
  @Expose() @Type(() => MyTableResponse) table!: MyTableResponse;
}

export class MyTablesResponse {
  @Expose() @Type(() => MyTableResponse) dmTables!: MyTableResponse[];
  @Expose()
  @Type(() => MyMembershipResponse)
  memberships!: MyMembershipResponse[];
  @Expose()
  @Type(() => MyJoinRequestResponse)
  joinRequests!: MyJoinRequestResponse[];
}
