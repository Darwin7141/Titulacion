import { Component, OnInit } from '@angular/core';
import { AdministradorService } from '../../services/administrador.service';
import { Router } from '@angular/router';
import { ValidacionesService } from '../../services/validaciones.service'; // Importar el servicio de validaciones
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';



@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.css'],
  standalone: false,
})
export class AdministradorComponent implements OnInit {
  administrador = {
    codigoadmin: '',
    ci: '',
    nombre: '',
    direccion: '',
    e_mail: '',
    telefono: '',
    contrasenia: ''
  };

  admin: any[] = [];
  esEdicion = false;

  constructor(
    private serviceAdmin: AdministradorService,
    private validaciones: ValidacionesService, // Inyectar el servicio de validaciones
    private _router: Router,
    private dialogRef: MatDialogRef<AdministradorComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {

    if (this.data?.admin) {
    this.administrador = { ...this.data.admin };   // precargar
    this.esEdicion     = true;
  }
    this.serviceAdmin.getAdministrador().subscribe({
      next: (data) => {
        this.admin = data; // Asigna los datos de administradores
      },
      error: (err) => {
        console.error('Error al obtener administradores:', err);
      },
    });
  }

  agregar() {
  if (!this.validaciones.validarCedulaEcuador(this.administrador.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.contrasenia.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Contraseña obligatoria</h2>
        <p class="swal-pro-desc">La contraseña es obligatoria.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarEmail(this.administrador.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarTelefono(this.administrador.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  // Verificaciones en backend
  this.serviceAdmin.verificarCedula(this.administrador.ci).subscribe((resp) => {
    if (resp.existe) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Cédula duplicada</h2>
          <p class="swal-pro-desc">La cédula ingresada ya se encuentra registrada.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      return;
    }

    this.serviceAdmin.verificarEmail(this.administrador.e_mail).subscribe((resp) => {
      if (resp.existe) {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-warn"></div>
            <h2 class="swal-pro-title">Correo duplicado</h2>
            <p class="swal-pro-desc">El correo ingresado ya se encuentra registrado.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Listo',
          buttonsStyling: false,
          focusConfirm: true,
          customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
        });
        return;
      }

      this.serviceAdmin.verificarTelefono(this.administrador.telefono).subscribe((resp) => {
        if (resp.existe) {
          Swal.fire({
            width: 480,
            html: `
              <div class="swal-pro-warn"></div>
              <h2 class="swal-pro-title">Teléfono duplicado</h2>
              <p class="swal-pro-desc">El teléfono ingresado ya se encuentra registrado.</p>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Listo',
            buttonsStyling: false,
            focusConfirm: true,
            customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
          });
          return;
        }

        // Agregar administrador
        this.serviceAdmin.agregar(this.administrador).subscribe({
          next: () => {
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-check"></div>
                <h2 class="swal-pro-title">Administrador agregado</h2>
                <p class="swal-pro-desc">Se guardó correctamente.</p>
              `,
              showConfirmButton: true,
              confirmButtonText: 'Listo',
              buttonsStyling: false,
              focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            }).then(() => this.dialogRef.close('added'));
          },
          error: (err) => {
            console.error('Error en enviar datos del administrador:', err);
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-error"></div>
                <h2 class="swal-pro-title">Error</h2>
                <p class="swal-pro-desc">Ocurrió un error al agregar el administrador.</p>
              `,
              showConfirmButton: true,
              confirmButtonText: 'Listo',
              buttonsStyling: false,
              focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            });
          }
        });
      });
    });
  });
}


  cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }



guardar(): void {
  if (!this.validaciones.validarCedulaEcuador(this.administrador.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.administrador.contrasenia.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Contraseña obligatoria</h2>
        <p class="swal-pro-desc">La contraseña es obligatoria.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarEmail(this.administrador.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarTelefono(this.administrador.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  const peticion$ = this.esEdicion
    ? this.serviceAdmin.editarAdmin(this.administrador)
    : this.serviceAdmin.agregar(this.administrador);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Administrador actualizado' : 'Administrador agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar administrador:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al guardar.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    }
  });
}

    }