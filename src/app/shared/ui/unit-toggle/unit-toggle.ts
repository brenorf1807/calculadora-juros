import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ToggleOption {
  value: string;
  label: string;
}

/**
 * Seletor segmentado genérico (ex.: Mensal/Anual, Meses/Anos).
 * Reutilizável por qualquer calculadora que precise alternar entre duas
 * (ou mais) opções de um mesmo campo.
 */
@Component({
  selector: 'app-unit-toggle',
  imports: [],
  templateUrl: './unit-toggle.html',
  styleUrl: './unit-toggle.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UnitToggleComponent),
      multi: true,
    },
  ],
})
export class UnitToggleComponent implements ControlValueAccessor {
  readonly options = input<ToggleOption[]>([]);

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(optionValue: string): void {
    if (this.disabled || optionValue === this.value) {
      return;
    }
    this.value = optionValue;
    this.onChange(optionValue);
    this.onTouched();
  }
}
