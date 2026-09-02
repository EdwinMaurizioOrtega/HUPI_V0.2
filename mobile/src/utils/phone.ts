export type NormalizedPhone = {
  countryCode: string;
  nationalNumber: string;
  displayNumber: string;
  normalizedPhone: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function codeDigits(countryCode: string) {
  return countryCode.replace(/\D/g, '');
}

export function normalizePhoneNumber(countryCode: string, rawPhone: string): NormalizedPhone {
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const dialingCode = codeDigits(code);
  let nationalNumber = onlyDigits(rawPhone);

  if (nationalNumber.startsWith(dialingCode)) {
    nationalNumber = nationalNumber.slice(dialingCode.length);
  }

  if (code === '+593' && nationalNumber.startsWith('0')) {
    nationalNumber = nationalNumber.slice(1);
  }

  return {
    countryCode: code,
    nationalNumber,
    displayNumber: formatPhoneForDisplay(code, nationalNumber),
    normalizedPhone: `${code}${nationalNumber}`,
  };
}

export function formatPhoneForDisplay(countryCode: string, rawPhone: string) {
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  let digits = onlyDigits(rawPhone);
  const dialingCode = codeDigits(code);

  if (digits.startsWith(dialingCode)) {
    digits = digits.slice(dialingCode.length);
  }

  if (code === '+593') {
    return digits.startsWith('0') ? digits : `0${digits}`;
  }

  return digits;
}

export function isPhoneNumberValid(countryCode: string, rawPhone: string) {
  const normalized = normalizePhoneNumber(countryCode, rawPhone);

  if (normalized.countryCode === '+593') {
    return normalized.nationalNumber.length === 9;
  }

  return normalized.nationalNumber.length >= 6;
}
