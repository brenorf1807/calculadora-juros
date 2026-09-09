import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rejeita valores negativos; permite zero (útil para aportes/valor inicial). */
export function nonNegativeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return Number(value) < 0 ? { negative: true } : null;
  };
}

/** Exige um valor estritamente maior que zero (útil para taxa e prazo). */
export function positiveValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return Number(value) <= 0 ? { notPositive: true } : null;
  };
}
