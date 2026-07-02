import type { CreateCustomerPayload, Customer } from '@core/types/domain';

export interface ICustomerRepository {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  addCustomer(payload: CreateCustomerPayload): Promise<Customer>;
  updateCustomer(customer: Customer): Promise<void>;
  deleteCustomer(id: string): Promise<void>;
}
