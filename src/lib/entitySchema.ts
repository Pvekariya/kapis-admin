import { z } from "zod";
import {
  FIELD_LIMITS,
  validateEmail,
  validateGstin,
  validateHexColor,
  validatePhone,
  validateSlug,
  validateUrl,
} from "@/lib/entityValidation";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().default("");

const phoneField = z
  .string()
  .trim()
  .max(FIELD_LIMITS.phone)
  .optional()
  .default("")
  .refine((value) => !validatePhone(value, false), "Use format: +91 9876543210");

const emailField = z
  .string()
  .trim()
  .max(FIELD_LIMITS.email)
  .optional()
  .default("")
  .refine((value) => !validateEmail(value, false), "Enter a valid email address")
  .transform((value) => value.toLowerCase());

const gstinField = z
  .string()
  .trim()
  .max(FIELD_LIMITS.gstin)
  .optional()
  .default("")
  .refine((value) => !validateGstin(value), "Enter a valid 15-character GSTIN");

const colorField = z
  .string()
  .trim()
  .optional()
  .default("#3b82f6")
  .refine((value) => !validateHexColor(value), "Use a valid hex color like #3b82f6");

const urlField = z
  .string()
  .trim()
  .max(FIELD_LIMITS.logoUrl)
  .optional()
  .default("")
  .refine((value) => !validateUrl(value), "Enter a valid URL");

export const InvoiceHeaderSchema = z.object({
  companyName: optionalTrimmed(FIELD_LIMITS.companyName),
  address: optionalTrimmed(FIELD_LIMITS.address),
  phone: phoneField,
  email: emailField,
  gstin: gstinField,
});

export const CreateTenantSchema = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.companyName),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(FIELD_LIMITS.slug)
    .refine((value) => !validateSlug(value), "Use lowercase letters, numbers, and hyphens only"),
  adminEmail: z
    .string()
    .trim()
    .max(FIELD_LIMITS.email)
    .refine((value) => !validateEmail(value, true), "Enter a valid email address")
    .transform((value) => value.toLowerCase()),
  adminPassword: z.string().min(6).max(FIELD_LIMITS.password),
  primaryColor: colorField,
  logoUrl: urlField,
  invoiceHeader: InvoiceHeaderSchema.optional().default({
    companyName: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
  }),
});

export const UpdateTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(FIELD_LIMITS.companyName).optional(),
  active: z.boolean().optional(),
  primaryColor: colorField.optional(),
  logoUrl: urlField.optional(),
  invoiceHeader: InvoiceHeaderSchema.optional(),
});

export const StaffSchema = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.personName),
  phone: phoneField,
  role: optionalTrimmed(FIELD_LIMITS.role),
  monthlySalary: z.number().min(0),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().trim().max(FIELD_LIMITS.personName).optional(),
  email: z
    .string()
    .trim()
    .max(FIELD_LIMITS.email)
    .optional()
    .refine((value) => value === undefined || !validateEmail(value, true), "Enter a valid email address")
    .transform((value) => value?.toLowerCase()),
  avatar: z.string().max(500_000).optional(),
});
