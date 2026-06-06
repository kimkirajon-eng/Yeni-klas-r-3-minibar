import { UserRole, OccupancyStatus, MinibarStatus } from '../../domain/enums';

export interface LoginDTO {
  username: string;
  password: string;
}

export interface AuthResponseDTO {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    role: UserRole;
  };
}

export interface CreateBlockDTO {
  name: string;
}

export interface UpdateBlockDTO {
  name?: string;
}

export interface CreateFloorDTO {
  name: string;
  blockId: string;
}

export interface UpdateFloorDTO {
  name?: string;
  blockId?: string;
}

export interface CreateRoomDTO {
  name: string;
  floorId: string;
  blockId: string;
}

export interface UpdateRoomDTO {
  name?: string;
  floorId?: string;
  blockId?: string;
  occupancyStatus?: OccupancyStatus;
  minibarStatus?: MinibarStatus;
  note?: string;
  isActive?: boolean;
}

export interface BatchOccupancyDTO {
  roomIds: string[];
  occupancyStatus: OccupancyStatus;
}

export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateProductDTO {
  name: string;
  price: number;
  stock?: number;
  minStockLevel?: number;
}

export interface UpdateProductDTO {
  name?: string;
  price?: number;
  stock?: number;
  minStockLevel?: number;
  isActive?: boolean;
}

export interface CreateShiftDTO {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateShiftDTO {
  userId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface UpdateRoomStatusDTO {
  roomId: string;
  status: MinibarStatus;
  note?: string;
}

export interface MinibarConsumptionDTO {
  roomId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  note?: string;
}

export interface RoomStatusChangeDTO {
  roomId: string;
  oldStatus: MinibarStatus | null;
  newStatus: MinibarStatus;
  occupancyStatus?: OccupancyStatus | null;
  note?: string | null;
  changedById: string;
}

export interface RoomDetailDTO {
  id: string;
  name: string;
  floor: string;
  block: string;
  occupancyStatus: OccupancyStatus;
  minibarStatus: MinibarStatus;
  note: string | null;
}

export interface DashboardStatsDTO {
  totalRooms: number;
  vacant: number;
  inhouse: number;
  arrival: number;
  departure: number;
  dnd: number;
  later: number;
  completed: number;
  pending: number;
  todayConsumptions: number;
  activePersonnel: number;
}
