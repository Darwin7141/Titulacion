import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio-cliente',
  standalone: false,
  
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.css'
})
export class InicioClienteComponent implements OnInit{

  constructor(
    private _auth:AuthService,
    private _router:Router){}
    logout(){
      this._auth.logOut();
      this._router.navigate(['login']);

    }

    ngOnInit() {
      
    }
  

}


