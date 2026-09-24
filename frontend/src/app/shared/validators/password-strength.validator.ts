import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Mirrors the backend's password policy (src/validation/auth.validation.ts) so users
 * get the same feedback before submitting instead of only finding out after a 422.
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};
    if (value.length < 8) {
      errors['minLength'] = true;
    }
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }
    if (!/[0-9]/.test(value)) {
      errors['number'] = true;
    }

    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}
