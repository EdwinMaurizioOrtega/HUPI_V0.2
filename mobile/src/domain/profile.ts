export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  sector: string;
  avatar: string;
  profilePhotoUri?: string;
};

export type ProfileFieldErrors = Partial<Record<'firstName' | 'lastName' | 'email', 'required' | 'invalid'>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function normalizeCustomerProfile(profile: CustomerProfile): CustomerProfile {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();

  return {
    ...profile,
    firstName,
    lastName,
    email: profile.email.trim().toLowerCase(),
    phone: profile.phone.trim(),
    avatar: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    profilePhotoUri: profile.profilePhotoUri?.trim() || undefined,
  };
}

export function getProfileFieldErrors(profile: CustomerProfile): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (!profile.firstName.trim()) errors.firstName = 'required';
  if (!profile.lastName.trim()) errors.lastName = 'required';
  if (!profile.email.trim()) errors.email = 'required';
  else if (!EMAIL_PATTERN.test(profile.email.trim())) errors.email = 'invalid';

  return errors;
}

export function isCustomerProfileComplete(profile: CustomerProfile) {
  return Object.keys(getProfileFieldErrors(profile)).length === 0;
}

