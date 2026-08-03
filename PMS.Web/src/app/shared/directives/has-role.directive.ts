import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  private requiredRoles: string[] = [];
  private isCreated = false;

  @Input({ required: true })
  set appHasRole(roles: string | string[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever role changes
      this.authStore.roleName();
      this.updateView();
    });
  }

  private updateView(): void {
    const hasPermission = this.authStore.hasRole(this.requiredRoles);

    if (hasPermission && !this.isCreated) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isCreated = true;
    } else if (!hasPermission && this.isCreated) {
      this.viewContainer.clear();
      this.isCreated = false;
    }
  }
}
