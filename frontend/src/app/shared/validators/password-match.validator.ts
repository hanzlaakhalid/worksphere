import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Cross-field validator: applied to the FormGroup, flags the confirm-password control. */
export function passwordMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey);
    const confirm = group.get(confirmKey);

    if (!password || !confirm) {
      return null;
    }

    if (confirm.value && confirm.value !== password.value) {
      confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
    } else if (confirm.errors) {
      const { passwordMismatch: _removed, ...rest } = confirm.errors;
      confirm.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }

    return null;
  };
}
