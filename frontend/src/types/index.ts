export enum UserRole {
  ADMIN = 'ADMIN',
  PERSONNEL = 'PERSONNEL',
}

export enum OccupancyStatus {
  VACANT = 'VACANT',
  INHOUSE = 'INHOUSE',
  ARRIVAL = 'ARRIVAL',
  DEPARTURE = 'DEPARTURE',
  DEPARTURE_ARRIVAL = 'DEPARTURE_ARRIVAL',
}

export enum MinibarStatus {
  DND = 'DND',
  LATER = 'LATER',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Block {
  id: string;
  name: string;
  floors?: Floor[];
  _count?: { rooms: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Floor {
  id: string;
  name: string;
  blockId: string;
  block?: Block;
  rooms?: Room[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
  blockId: string;
  floor?: Floor;
  block?: Block;
  occupancyStatus: OccupancyStatus;
  minibarStatus: MinibarStatus;
  note: string | null;
  isActive?: boolean;
  minibarLogs?: MinibarLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MinibarLog {
  id: string;
  roomId: string;
  room?: Room;
  productId: string;
  product?: Product;
  quantity: number;
  personnelId: string;
  personnel?: { firstName: string; lastName: string };
  performedAt: string;
  createdAt?: string;
}

export interface RoomStatusHistory {
  id: string;
  roomId: string;
  room?: Room;
  oldStatus: MinibarStatus | null;
  newStatus: MinibarStatus;
  occupancyStatus?: OccupancyStatus | null;
  note?: string | null;
  changedById: string;
  changedBy?: { firstName: string; lastName: string; role: string };
  createdAt: string;
}

export interface DashboardStats {
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

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    role: UserRole;
  };
}

export interface BatchOccupancyRequest {
  roomIds: string[];
  occupancyStatus: OccupancyStatus;
}

export interface UpdateRoomStatusRequest {
  roomId: string;
  status: MinibarStatus;
  note?: string;
}

export interface MinibarConsumptionRequest {
  roomId: string;
  items: Array<{ productId: string; quantity: number }>;
  note?: string;
}

export interface RoomDetail {
  id: string;
  name: string;
  floor: string;
  block: string;
  occupancyStatus: OccupancyStatus;
  minibarStatus: MinibarStatus;
  note: string | null;
}

export interface Shift {
  id: string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string; username: string; role: string };
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockSummary {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  products: Product[];
}
