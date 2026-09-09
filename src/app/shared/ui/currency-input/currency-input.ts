import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { centsToReais, formatBRL } from '../../../core/utils/currency.util';

/**
 * Input de valor monetário (R$) reutilizável por qualquer calculadora.
 * Funciona como uma máscara: o usuário digita apenas números e os dois
 * últimos dígitos viram centavos automaticamente.
 */
@Component({
  selector: 'app-currency-input',
  imports: [],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true,
    },
  ],
})
export class CurrencyInputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly inputId = input('', { alias: 'id' });

  displayValue = formatBRL(0);
  disabled = false;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.displayValue = formatBRL(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const numericValue = centsToReais(target.value);
    this.displayValue = formatBRL(numericValue);
    this.onChange(numericValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
