import { TestBed } from '@angular/core/testing';

import { AdSlotComponent } from './ad-slot';

describe('AdSlotComponent', () => {
  it('não renderiza nenhum bloco de anúncio enquanto o AdSense não estiver configurado', async () => {
    await TestBed.configureTestingModule({
      imports: [AdSlotComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdSlotComponent);
    fixture.componentRef.setInput('slot', '0000000000');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('ins.adsbygoogle')).toBeNull();
  });
});
