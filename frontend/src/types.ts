export type DarshanSlot = {
  slot: string;
  maxPilgrims: number;
  bookedCount: number;
};

export type Temple = {
  _id: string;
  name: string;
  location: string;
  totalCapacity: number;
  currentOccupancy: number;
  darshanTimings: DarshanSlot[];
};

