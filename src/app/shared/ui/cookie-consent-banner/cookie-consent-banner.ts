import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConsentService } from '../../../core/services/consent.service';

/**
 * Banner de consentimento de cookies (Google Analytics e, quando
 * configurado, Google AdSense). Some assim que o usuário escolhe uma
 * opção — a escolha fica salva (ver `ConsentService`).
 */
@Component({
  selector: 'app-cookie-consent-banner',
  imports: [RouterLink],
  templateUrl: './cookie-consent-banner.html',
  styleUrl: './cookie-consent-banner.scss',
})
export class CookieConsentBannerComponent {
  protected readonly consentService = inject(ConsentService);
}
