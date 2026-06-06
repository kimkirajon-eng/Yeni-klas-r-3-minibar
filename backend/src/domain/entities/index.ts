import { UserRole, OccupancyStatus, MinibarStatus } from '../enums';

export interface IBlock {
  id: string;
  name: string;
  floors: IFloor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFloor {
  id: string;
  name: string;
  blockId: string;
  block?: IBlock;
  rooms: IRoom[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  id: string;
  name: string;
  floorId: string;
  blockId: string;
  floor?: IFloor;
  block?: IBlock;
  occupancyStatus: OccupancyStatus;
  minibarStatus: MinibarStatus;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMinibarLog {
  id: string;
  roomId: string;
  room?: IRoom;
  productId: string;
  product?: IProduct;
  quantity: number;
  personnelId: string;
  personnel?: IUser;
  performedAt: Date;
  createdAt: Date;
}

export interface IRoomStatusHistory {
  id: string;
  roomId: string;
  room?: IRoom;
  oldStatus: MinibarStatus | null;
  newStatus: MinibarStatus;
  occupancyStatus: OccupancyStatus | null;
  note: string | null;
  changedById: string;
  changedBy?: IUser;
  createdAt: Date;
}
