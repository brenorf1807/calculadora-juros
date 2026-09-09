import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { formatPercentInput, parsePercentInput } from '../../../core/utils/percent.util';

/** Input de percentual (taxa de juros) reutilizável, com vírgula decimal (padrão BR). */
@Component({
  selector: 'app-percent-input',
  imports: [],
  templateUrl: './percent-input.html',
  styleUrl: './percent-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PercentInputComponent),
      multi: true,
    },
  ],
})
export class PercentInputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly inputId = input('', { alias: 'id' });

  displayValue = '';
  disabled = false;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.displayValue = formatPercentInput(value);
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
    this.displayValue = target.value;
    this.onChange(parsePercentInput(target.value));
  }

  onBlur(): void {
    this.displayValue = formatPercentInput(parsePercentInput(this.displayValue));
    this.onTouched();
  }
}
