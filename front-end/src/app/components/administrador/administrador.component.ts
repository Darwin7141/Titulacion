import { Component, OnInit } from '@angular/core';
import { AdministradorService } from '../../services/administrador.service';
import { Router } from '@angular/router';
import { ValidacionesService } from '../../services/validaciones.service'; // Importar el servicio de validaciones
import Swal from 'sweetalert2';
@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.css'],
  standalone: false,
})
export class AdministradorComponent implements OnInit {
  administrador = {
    ci: '',
    nombre: '',
    direccion: '',
    e_mail: '',
    telefono: '',
    contrasenia: ''
  };

  admin: any[] = [];

  constructor(
    private serviceAdmin: AdministradorService,
    private validaciones: ValidacionesService, // Inyectar el servicio de validaciones
    private _router: Router
  ) {}

  ngOnInit(): void {
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
        icon: 'error',
        title: 'Cédula no válida',
        text: 'La cédula ingresada no es válida.',
      });
      return;
    }
  
    if (!this.administrador.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Nombre obligatorio',
        text: 'El nombre es obligatorio.',
      });
      return;
    }
  
    if (!this.administrador.direccion.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Dirección obligatoria',
        text: 'La dirección es obligatoria.',
      });
      return;
    }

    if (!this.administrador.contrasenia.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña obligatoria',
        text: 'La contraseña es obligatoria.',
      });
      return;
    }
  

    if (!this.validaciones.validarEmail(this.administrador.e_mail)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo no válido',
        text: 'El correo electrónico no es válido.',
      });
      return;
    }
  
    if (!this.validaciones.validarTelefono(this.administrador.telefono)) {
      Swal.fire({
        icon: 'error',
        title: 'Teléfono no válido',
        text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
      });
      return;
    }
  
    // Lógica de verificación y envío
    this.serviceAdmin.verificarCedula(this.administrador.ci).subscribe((resp) => {
      if (resp.existe) {
        Swal.fire({
          icon: 'warning',
          title: 'Cédula duplicada',
          text: 'La cédula ingresada ya existe en la base de datos.',
        });
        return;
      }
      this.serviceAdmin.verificarEmail(this.administrador.e_mail).subscribe((resp) => {
        if (resp.existe) {
          Swal.fire({
            icon: 'warning',
            title: 'Correo duplicado',
            text: 'El correo ingresado ya existe en la base de datos.',
          });
          return;
        }
        this.serviceAdmin.verificarTelefono(this.administrador.telefono).subscribe((resp) => {
          if (resp.existe) {
            Swal.fire({
              icon: 'warning',
              title: 'Teléfono duplicado',
              text: 'El número de teléfono ingresado ya existe en la base de datos.',
            });
            return;
          }
  
          // Si todo es válido, agregar el administrador
          this.serviceAdmin.agregar(this.administrador).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Administrador agregado correctamente.',
              }).then(() => {
                this._router.navigate(['/listaAdministrador']);
              });
            },
            error: (err) => {
              console.error('Error en enviar datos del administrador:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al agregar el administrador.',
              });
            },
          });
        });
      });
    });
  }
}