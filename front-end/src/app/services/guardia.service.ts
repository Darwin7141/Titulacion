import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class GuardiaService implements CanActivate {
  constructor(private _auth: AuthService, private _router: Router) {}

  canActivate() {
    const identity = this._auth.getIdentity();
    if (identity) {
      return true;
    } else {
      this._router.navigate(['/login']);
      return false;
    }
  }
}