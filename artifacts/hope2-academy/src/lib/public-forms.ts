/**
 * Public website form submissions.
 *
 * Every public form (contact, volunteer application, newsletter, donation
 * pledge) persists into the same data layer the portal reads from, so staff
 * can action them from the "Website Inbox" modules.
 */
import { mockDb } from "@/lib/mock-backend";

const today = () => new Date().toISOString().slice(0, 10);

export type Inquiry = { id?: string; name: string; email: string; subject: string; message: string; received: string; status: string };
export type VolunteerApplication = { id?: string; name: string; email: string; country: string; phone: string; interest: string; motivation: string; received: string; status: string };
export type Subscriber = { id?: string; email: string; joined: string; status: string };
export type Pledge = { id?: string; donor: string; email: string; amountUsd: number; frequency: string; received: string; status: string };

export const publicForms = {
  submitInquiry(input: Omit<Inquiry, "id" | "received" | "status">) {
    return mockDb.create<Inquiry>("inquiries", { ...input, received: today(), status: "New" });
  },
  submitVolunteer(input: Omit<VolunteerApplication, "id" | "received" | "status">) {
    return mockDb.create<VolunteerApplication>("volunteers", { ...input, received: today(), status: "Pending" });
  },
  subscribe(email: string) {
    const existing = mockDb.list<Subscriber>("subscribers").find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    return mockDb.create<Subscriber>("subscribers", { email, joined: today(), status: "Active" });
  },
  pledge(input: Omit<Pledge, "id" | "received" | "status">) {
    return mockDb.create<Pledge>("pledges", { ...input, received: today(), status: "Pending" });
  },
};
