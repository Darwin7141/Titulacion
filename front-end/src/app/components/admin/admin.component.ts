import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: false,
  
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit{

  showGestionUsuarios = false;
  showProductos = false;
  showCatering = false;

  constructor(
    private _auth:AuthService,
    private _router:Router){}
    logout(){
      this._auth.logOut();
      this._router.navigate(['login']);

    }

    ngOnInit() {
      
    }

    toggleGestionUsuarios() {
      this.showGestionUsuarios = !this.showGestionUsuarios;
    }
  
    toggleProductos() {
      this.showProductos = !this.showProductos;
    }
  
    toggleCatering() {
      this.showCatering = !this.showCatering;
    }
  

}
