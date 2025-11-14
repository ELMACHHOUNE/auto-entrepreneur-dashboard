const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^\d{9,15}$/;
const ICE_REGEX = /^\d{15}$/;
const PROFILE_KINDS = ['guide_auto_entrepreneur', 'company_guide'] as const;

export type ProfileKind = (typeof PROFILE_KINDS)[number];

export interface ProfileUpdateInput {
  email?: string;
  fullName?: string;
  phone?: string;
  ICE?: string;
  service?: string;
  profileKind?: ProfileKind;
  serviceCategory?: string;
  serviceType?: string;
  serviceActivity?: string;
  companyTypeCode?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function parseProfileUpdate(body: any):
  | {
      ok: true;
      data: ProfileUpdateInput;
    }
  | {
      ok: false;
      errors: ValidationError[];
    } {
  const errors: ValidationError[] = [];
  const update: ProfileUpdateInput = {};
  const input = body ?? {};

  const allowedFields = new Set([
    'email',
    'fullName',
    'phone',
    'ICE',
    'service',
    'profileKind',
    'serviceCategory',
    'serviceType',
    'serviceActivity',
    'companyTypeCode',
  ]);
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) {
      errors.push({ field: key, message: 'Unexpected field' });
    }
  }

  if (input.email !== undefined) {
    const email = String(input.email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email address' });
    } else {
      update.email = email;
    }
  }

  if (input.fullName !== undefined) {
    const fullName = String(input.fullName).trim();
    if (fullName !== '' && fullName.length < 2) {
      errors.push({ field: 'fullName', message: 'Full name is too short' });
    } else {
      update.fullName = fullName;
    }
  }

  if (input.phone !== undefined) {
    const phone = String(input.phone).trim();
    if (phone !== '' && !PHONE_REGEX.test(phone)) {
      errors.push({ field: 'phone', message: 'Phone must be 9–15 digits' });
    } else {
      update.phone = phone;
    }
  }

  if (input.ICE !== undefined) {
    const ice = String(input.ICE).trim();
    if (ice !== '' && !ICE_REGEX.test(ice)) {
      errors.push({ field: 'ICE', message: 'ICE must be exactly 15 digits' });
    } else {
      update.ICE = ice;
    }
  }

  const optionalStrings: Array<Exclude<keyof ProfileUpdateInput, 'profileKind'>> = [
    'service',
    'serviceCategory',
    'serviceType',
    'serviceActivity',
    'companyTypeCode',
  ];
  for (const field of optionalStrings) {
    if (input[field] !== undefined) {
      update[field] = String(input[field]).trim();
    }
  }

  if (input.profileKind !== undefined) {
    const kind = String(input.profileKind);
    if (!PROFILE_KINDS.includes(kind as ProfileKind)) {
      errors.push({ field: 'profileKind', message: 'Invalid profile kind' });
    } else {
      update.profileKind = kind as ProfileKind;
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }
  return { ok: true, data: update };
}
