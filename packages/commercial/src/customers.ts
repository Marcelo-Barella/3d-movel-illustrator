import { createId } from "@movel/shared";
import type { Customer } from "./types.js";

export function createCustomer(
  input: Omit<Customer, "id"> & { id?: string },
): Customer {
  return {
    id: input.id ?? createId("cust"),
    name: input.name,
    email: input.email,
    phone: input.phone,
    notes: input.notes,
  };
}

export function upsertCustomer(
  customers: Customer[],
  customer: Customer,
): Customer[] {
  const next = customers.filter((c) => c.id !== customer.id);
  next.push(customer);
  return next;
}
