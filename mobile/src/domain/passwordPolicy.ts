export const HUPI_PASSWORD_MIN_LENGTH = 8;

export type PasswordChangeFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordChangeError = 'required' | 'too_short' | 'mismatch';

export function validatePasswordChange(fields: PasswordChangeFields): PasswordChangeError | null {
  if (!fields.currentPassword || !fields.newPassword || !fields.confirmPassword) {
    return 'required';
  }
  if (fields.newPassword.length < HUPI_PASSWORD_MIN_LENGTH) {
    return 'too_short';
  }
  if (fields.newPassword !== fields.confirmPassword) {
    return 'mismatch';
  }
  return null;
}
