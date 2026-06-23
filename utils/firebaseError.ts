import type { TranslationKey } from '../i18n/translations';

function errorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: string }).code).replace('functions/', '');
  }
  return '';
}

export function sendOtpErrorKey(err: unknown): TranslationKey {
  switch (errorCode(err)) {
    case 'invalid-argument': return 'errors.invalidPhone';
    case 'resource-exhausted': return 'errors.tooManyRequests';
    default: return 'errors.generic';
  }
}

export function verifyOtpErrorKey(err: unknown): TranslationKey {
  switch (errorCode(err)) {
    case 'invalid-argument': return 'errors.invalidOtp';
    case 'not-found': return 'errors.sessionNotFound';
    case 'deadline-exceeded': return 'errors.otpExpired';
    default: return 'errors.generic';
  }
}
