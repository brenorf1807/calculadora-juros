import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConsentService } from '../../../core/services/consent.service';
import { CookieConsentBannerComponent } from './cookie-consent-banner';

describe('CookieConsentBannerComponent', () => {
  beforeEach(() => {
    localStorage.removeItem('cookie-consent');
  });

  afterEach(() => {
    localStorage.removeItem('cookie-consent');
  });

  it('aparece quando o consentimento ainda não foi decidido', async () => {
    await TestBed.configureTestingModule({
      imports: [CookieConsentBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentBannerComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cookie-banner')).not.toBeNull();
  });

  it('some depois de aceitar', async () => {
    await TestBed.configureTestingModule({
      imports: [CookieConsentBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentBannerComponent);
    fixture.detectChanges();

    const consentService = TestBed.inject(ConsentService);
    consentService.grant();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cookie-banner')).toBeNull();
  });

  it('some depois de recusar', async () => {
    await TestBed.configureTestingModule({
      imports: [CookieConsentBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentBannerComponent);
    fixture.detectChanges();

    const consentService = TestBed.inject(ConsentService);
    consentService.deny();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cookie-banner')).toBeNull();
  });
});
