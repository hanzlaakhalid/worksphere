import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { Role } from '../../core/models/user.model';

/**
 * Structural directive that shows its content only when the current user's
 * role is in the allowed set. Usage: `<button *appHasRole="'ADMIN'">...</button>`
 * or `*appHasRole="['ADMIN', 'HR_MANAGER']"`.
 */
@Directive({
  selector: '[appHasRole]',
})
export class HasRole {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authFacade = inject(AuthFacade);

  readonly appHasRole = input.required<Role | Role[]>();

  private hasView = false;

  constructor() {
    effect(() => {
      const allowedRoles = ([] as Role[]).concat(this.appHasRole());
      const currentRole = this.authFacade.role();
      const shouldShow = currentRole !== null && allowedRoles.includes(currentRole);

      if (shouldShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!shouldShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
