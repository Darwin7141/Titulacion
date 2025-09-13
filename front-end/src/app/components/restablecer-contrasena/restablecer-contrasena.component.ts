import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';
import { MatDialog } from '@angular/material/dialog';
import { ReestablecerDialogoComponent } from '../reestablecer-dialogo/reestablecer-dialogo.component';


@Component({
  selector: 'app-restablecer-contrasena',
  standalone: false,
  
  templateUrl: './restablecer-contrasena.component.html',
  styleUrls: ['./restablecer-contrasena.component.css']
})
export class RestablecerContrasenaComponent implements OnInit {
  constructor(private route: ActivatedRoute, private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') || '';
    this.dialog.open(ReestablecerDialogoComponent, {
      width: '360px',
      panelClass: 'recuperar-dialog-container',
      backdropClass: 'recuperar-dialog-backdrop',
      data: { token }
    });
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}