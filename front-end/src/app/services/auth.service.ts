import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  getIdentity() {
    if (typeof window !== 'undefined' && localStorage) {
      const identity = localStorage.getItem('identity_user');
      return identity ? identity : null;
    }
    return null; // En caso de que no estés en un entorno de navegador
  }

  logOut() {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.removeItem('identity_user');
      localStorage.clear();
    }
  }
}