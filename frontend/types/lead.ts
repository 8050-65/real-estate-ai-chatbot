export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  status?: string;
  assignedTo?: string;
  projectInterest?: string;
  budgetRange?: string;
  createdAt?: string;
  updatedAt?: string;
}
