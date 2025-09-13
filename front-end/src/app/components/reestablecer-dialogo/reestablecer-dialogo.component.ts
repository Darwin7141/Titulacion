import { Component } from '@angular/core';
import {  Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reestablecer-dialogo',
  standalone: false,
  
  templateUrl: './reestablecer-dialogo.component.html',
  styleUrls: ['./reestablecer-dialogo.component.css']
})
export class ReestablecerDialogoComponent {
  isLoading = false;
  pass = '';
  confirm = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { token: string },
    private dialogRef: MatDialogRef<ReestablecerDialogoComponent>,
    private recuperarService: RecuperarContrasenaService
  ) {}

  submit(form: NgForm) {
  if (form.invalid || this.pass !== this.confirm) return;

  this.isLoading = true;
  this.recuperarService.restablecerContraseña({
    token: this.data.token,
    nuevaContrasena: this.pass
  })
  .pipe(finalize(() => this.isLoading = false))
  .subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">¡Listo!</h2>
          <p class="swal-pro-desc">Tu contraseña fue actualizada correctamente.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Ingresar',
        buttonsStyling: false,
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html'
        }
      }).then(() => this.dialogRef.close(true)); // cierra el modal
    },
    error: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">No se pudo actualizar</h2>
          <p class="swal-pro-desc">El enlace puede haber expirado. Solicítalo nuevamente.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        buttonsStyling: false,
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html'
        }
      });
    }
  });
}
  close() { this.dialogRef.close(); }
}
