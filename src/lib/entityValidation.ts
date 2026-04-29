export const FIELD_LIMITS = {
  companyName: 200,
  personName: 100,
  slug: 50,
  email: 200,
  phone: 16,
  role: 100,
  address: 300,
  gstin: 15,
  logoUrl: 500,
  color: 7,
  password: 72,
} as const;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+\d{1,4}\s\d{6,12}$/;
const slugRegex = /^[a-z0-9-]+$/;
const gstinRegex =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export function sanitizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, FIELD_LIMITS.slug);
}

export function sanitizePhone(value: string) {
  const trimmed = value.replace(/[^\d+\s]/g, "");
  if (!trimmed.startsWith("+")) {
    return trimmed.replace(/\s+/g, "").slice(0, FIELD_LIMITS.phone);
  }

  const compact = trimmed.slice(1).replace(/[^\d]/g, "");
  const countryCode = compact.slice(0, Math.min(4, compact.length));
  const localNumber = compact.slice(countryCode.length, countryCode.length + 12);

  if (!countryCode) {
    return "+";
  }

  return localNumber ? `+${countryCode} ${localNumber}` : `+${countryCode}`;
}

export function sanitizeGstin(value: string) {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, FIELD_LIMITS.gstin);
}

export function sanitizeHexColor(value: string) {
  const raw = value.trim();
  if (!raw.startsWith("#")) {
    return `#${raw.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)}`;
  }
  return `#${raw.slice(1).replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)}`;
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength: number
) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or less`;
  }
  return "";
}

export function validateOptionalText(
  value: string,
  label: string,
  maxLength: number
) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or less`;
  }
  return "";
}

export function validateEmail(value: string, required = false) {
  const email = sanitizeEmail(value);
  if (!email) return required ? "Email is required" : "";
  if (email.length > FIELD_LIMITS.email) {
    return `Email must be ${FIELD_LIMITS.email} characters or less`;
  }
  if (!emailRegex.test(email)) {
    return "Enter a valid email address";
  }
  return "";
}

export function validatePhone(value: string, required = false) {
  const phone = value.trim();
  if (!phone) return required ? "Phone number is required" : "";
  if (phone.length > FIELD_LIMITS.phone) {
    return `Phone number must be ${FIELD_LIMITS.phone} characters or less`;
  }
  if (!phoneRegex.test(phone)) {
    return "Use format: +91 9876543210";
  }
  return "";
}

export function validateSlug(value: string) {
  const slug = value.trim();
  if (!slug) return "Subdomain slug is required";
  if (slug.length < 2) return "Subdomain slug must be at least 2 characters";
  if (slug.length > FIELD_LIMITS.slug) {
    return `Subdomain slug must be ${FIELD_LIMITS.slug} characters or less`;
  }
  if (!slugRegex.test(slug)) {
    return "Use lowercase letters, numbers, and hyphens only";
  }
  return "";
}

export function validateGstin(value: string) {
  const gstin = value.trim();
  if (!gstin) return "";
  if (gstin.length !== FIELD_LIMITS.gstin || !gstinRegex.test(gstin)) {
    return "Enter a valid 15-character GSTIN";
  }
  return "";
}

export function validateHexColor(value: string) {
  const color = value.trim();
  if (!color) return "";
  if (!hexColorRegex.test(color)) {
    return "Use a valid hex color like #3b82f6";
  }
  return "";
}

export function validateUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (url.length > FIELD_LIMITS.logoUrl) {
    return `URL must be ${FIELD_LIMITS.logoUrl} characters or less`;
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "URL must start with http:// or https://";
    }
    return "";
  } catch {
    return "Enter a valid URL";
  }
}
