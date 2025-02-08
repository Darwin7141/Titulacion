import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-inicio-empleado',
  standalone: false,
  
  templateUrl: './inicio-empleado.component.html',
  styleUrl: './inicio-empleado.component.css'
})
export class InicioEmpleadoComponent implements OnInit{

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
