export interface Property {
  id: string;
  projectId: string;
  name: string;
  bhk: string;
  area: number;
  price: number;
  currency: string;
  status: 'available' | 'sold' | 'blocked';
  floor: number;
  tower?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  city: string;
  totalUnits: number;
  availableUnits: number;
  launchDate?: string;
  completionDate?: string;
  description?: string;
  createdAt?: string;
}
