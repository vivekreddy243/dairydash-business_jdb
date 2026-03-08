export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export interface Apartment {
  id: string;
  name: string;
  number_of_blocks: number;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  milk_type: string;
  default_qty: number;
  price_per_liter: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  apartment_id: string;
  block: string;
  floor: string;
  flat_no: string;
  address: string;
  delivery_option?: 'Daily' | 'Alternate Days' | 'Weekly' | 'Custom';
  custom_delivery_notes?: string | null;
  status: 'active' | 'paused';
  created_at: string;
  subscription?: Subscription;
}

export interface Delivery {
  id: string;
  customer_id: string;
  delivery_date: string;
  quantity: number;
  status: 'delivered' | 'skipped' | 'pending';
  created_at: string;
}

export interface BillingRecord {
  date: string;
  quantity: number;
  status: string;
}
