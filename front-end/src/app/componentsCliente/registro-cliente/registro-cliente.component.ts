import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { PreclientesService } from '../../services/preclientes.service';
import { ValidacionesService } from '../../services/validaciones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-cliente',
  standalone: false,

  templateUrl: './registro-cliente.component.html',
  styleUrl: './registro-cliente.component.css',
})
export class RegistroClienteComponent implements OnInit {
  registro = {
    ci: '',
    nombre: '',
    telefono: '',
    direccion: '',
    correo: '',
    contrasenia: '',
  };
  private ultimoChequeo = { ci: '', correo: '', telefono: '' };
  private registroRef?: MatDialogRef<any>;

  constructor(
    private dialogRef: MatDialogRef<RegistroClienteComponent>,
    private serviceRegistro: PreclientesService,
    private validaciones: ValidacionesService, // Inyectar el servicio de validaciones
    private _router: Router
  ) {}

  ngOnInit(): void {}

  onSubmit() {
    if (!this.validaciones.validarCedulaEcuador(this.registro.ci)) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    if (!this.registro.nombre.trim()) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    if (!this.registro.direccion.trim()) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    if (!this.registro.contrasenia.trim()) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    if (!this.validaciones.validarEmail(this.registro.correo)) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    if (!this.validaciones.validarTelefono(this.registro.telefono)) {
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
        customClass: {
          popup: 'swal-pro',
          confirmButton: 'swal-pro-confirm',
          htmlContainer: 'swal-pro-html',
        },
      });
      return;
    }

    // Lógica de verificación y envío
    this.serviceRegistro.verificarCedula(this.registro.ci).subscribe((resp) => {
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
          customClass: {
            popup: 'swal-pro',
            confirmButton: 'swal-pro-confirm',
            htmlContainer: 'swal-pro-html',
          },
        });
        return;
      }
      this.serviceRegistro
        .verificarEmail(this.registro.correo)
        .subscribe((resp) => {
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
              customClass: {
                popup: 'swal-pro',
                confirmButton: 'swal-pro-confirm',
                htmlContainer: 'swal-pro-html',
              },
            });
            return;
          }
          this.serviceRegistro
            .verificarTelefono(this.registro.telefono)
            .subscribe((resp) => {
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
                  customClass: {
                    popup: 'swal-pro',
                    confirmButton: 'swal-pro-confirm',
                    htmlContainer: 'swal-pro-html',
                  },
                });
                return;
              }

              // Si todo es válido, agregar el administrador
              this.serviceRegistro.agregar(this.registro).subscribe({
                next: (response) => {
                  Swal.fire({
                    width: 480,
                    html: `
                                       <div class="swal-pro-check"></div>
                                       <h2 class="swal-pro-title">Usuario agregado</h2>
                                       <p class="swal-pro-desc">Su registro ha sido exitoso.</p>
                                     `,
                    showConfirmButton: true,
                    confirmButtonText: 'Listo',
                    buttonsStyling: false,
                    focusConfirm: true,
                    customClass: {
                      popup: 'swal-pro',
                      confirmButton: 'swal-pro-confirm',
                      htmlContainer: 'swal-pro-html',
                    },
                  }).then(() => {
                    this._router.navigate(['/login']);
                    this.dialogRef.close(); 
                  });
                },
                error: (err) => {
                  console.error('Error en enviar datos del registro:', err);
                  Swal.fire({
                    width: 480,
                    html: `
                                        <div class="swal-pro-error"></div>
                                        <h2 class="swal-pro-title">Error</h2>
                                        <p class="swal-pro-desc">Ocurrió un error al agregar el usuario</p>
                                      `,
                    showConfirmButton: true,
                    confirmButtonText: 'Listo',
                    buttonsStyling: false,
                    focusConfirm: true,
                    customClass: {
                      popup: 'swal-pro',
                      confirmButton: 'swal-pro-confirm',
                      htmlContainer: 'swal-pro-html',
                    },
                  });
                },
              });
            });
        });
    });
  }

  
   closeRegistro() {
    this.registroRef?.close();
    this._router.navigate(['/login']);
  }
  // ==== Helpers de alertas (mismo estilo) ====

  private mostrarAviso(titulo: string, mensaje: string) {
    Swal.fire({
      width: 480,
      html: `
           <div class="swal-pro-warn"></div>
           <h2 class="swal-pro-title">${titulo}</h2>
           <p class="swal-pro-desc">${mensaje}</p>
         `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: {
        popup: 'swal-pro',
        confirmButton: 'swal-pro-confirm',
        htmlContainer: 'swal-pro-html',
      },
    });
  }

  private mostrarError(titulo: string, mensaje: string) {
    Swal.fire({
      width: 480,
      html: `
           <div class="swal-pro-error"></div>
           <h2 class="swal-pro-title">${titulo}</h2>
           <p class="swal-pro-desc">${mensaje}</p>
         `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      focusConfirm: true,
      customClass: {
        popup: 'swal-pro',
        confirmButton: 'swal-pro-confirm',
        htmlContainer: 'swal-pro-html',
      },
    });
  }

  // ==== Validaciones al salir de cada campo (blur) ====
  alSalirCedula(valor: string) {
    const v = (valor ?? '').trim();
    if (!v) {
      this.mostrarAviso('Cédula obligatoria', 'La cédula es obligatoria.');
      return;
    }
    if (!this.validaciones.validarCedulaEcuador(v)) {
      this.mostrarError(
        'Cédula no válida',
        'La cédula ingresada no es válida.'
      );
    }
  }

  alSalirNombre(valor: string) {
    const v = (valor ?? '').trim();
    if (!v)
      this.mostrarAviso('Nombre obligatorio', 'El nombre es obligatorio.');
  }

  alSalirDireccion(valor: string) {
    const v = (valor ?? '').trim();
    if (!v)
      this.mostrarAviso(
        'Dirección obligatoria',
        'La dirección es obligatoria.'
      );
  }

  alSalirCorreo(valor: string) {
    const v = (valor ?? '').trim();
    if (!v) {
      this.mostrarAviso(
        'Correo obligatorio',
        'El correo electrónico es obligatorio.'
      );
      return;
    }
    if (!this.validaciones.validarEmail(v)) {
      this.mostrarError(
        'Correo no válido',
        'El correo electrónico no es válido.'
      );
    }
  }

  alSalirTelefono(valor: string) {
    const v = (valor ?? '').trim();
    if (!v) {
      this.mostrarAviso('Teléfono obligatorio', 'El teléfono es obligatorio.');
      return;
    }
    if (!this.validaciones.validarTelefono(v)) {
      this.mostrarError(
        'Teléfono no válido',
        'El número debe tener 10 dígitos y comenzar con 0.'
      );
    }
  }

  alSalirContrasenia(valor: string) {
    const v = (valor ?? '').trim();
    if (!v) {
      this.mostrarAviso(
        'Contraseña obligatoria',
        'La contraseña es obligatoria.'
      );
      return;
    }
    if (v.length < 6)
      this.mostrarAviso(
        'Contraseña corta',
        'La contraseña debe tener mínimo 6 caracteres.'
      );
  }

  cerrar() { this.dialogRef.close(); }
}
