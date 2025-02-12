import { Component, OnInit } from '@angular/core';
import { PreclientesService } from '../../services/preclientes.service';
import { Router } from '@angular/router';
import { ValidacionesService } from '../../services/validaciones.service'; // Importar el servicio de validaciones
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro-cliente',
  standalone: false,
  
  templateUrl: './registro-cliente.component.html',
  styleUrl: './registro-cliente.component.css'
})
export class RegistroClienteComponent implements OnInit {
  registro = {
    ci: '',
    nombre: '',
    
    telefono: '',
    direccion: '',
    correo: '',
    contrasenia: ''
  };

  constructor(
      private serviceRegistro: PreclientesService,
      private validaciones: ValidacionesService, // Inyectar el servicio de validaciones
      private _router: Router
    ) {}

    ngOnInit(): void {
      
    }

    agregar() {
        if (!this.validaciones.validarCedulaEcuador(this.registro.ci)) {
          Swal.fire({
            icon: 'error',
            title: 'Cédula no válida',
            text: 'La cédula ingresada no es válida.',
          });
          return;
        }
      
        if (!this.registro.nombre.trim()) {
          Swal.fire({
            icon: 'error',
            title: 'Nombre obligatorio',
            text: 'El nombre es obligatorio.',
          });
          return;
        }
      
        if (!this.registro.direccion.trim()) {
          Swal.fire({
            icon: 'error',
            title: 'Dirección obligatoria',
            text: 'La dirección es obligatoria.',
          });
          return;
        }
    
        if (!this.registro.contrasenia.trim()) {
          Swal.fire({
            icon: 'error',
            title: 'Contraseña obligatoria',
            text: 'La contraseña es obligatoria.',
          });
          return;
        }
      
    
        if (!this.validaciones.validarEmail(this.registro.correo)) {
          Swal.fire({
            icon: 'error',
            title: 'Correo no válido',
            text: 'El correo electrónico no es válido.',
          });
          return;
        }
      
        if (!this.validaciones.validarTelefono(this.registro.telefono)) {
          Swal.fire({
            icon: 'error',
            title: 'Teléfono no válido',
            text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
          });
          return;
        }
      
        // Lógica de verificación y envío
        this.serviceRegistro.verificarCedula(this.registro.ci).subscribe((resp) => {
          if (resp.existe) {
            Swal.fire({
              icon: 'warning',
              title: 'Cédula duplicada',
              text: 'La cédula ingresada ya existe en la base de datos.',
            });
            return;
          }
          this.serviceRegistro.verificarEmail(this.registro.correo).subscribe((resp) => {
            if (resp.existe) {
              Swal.fire({
                icon: 'warning',
                title: 'Correo duplicado',
                text: 'El correo ingresado ya existe en la base de datos.',
              });
              return;
            }
            this.serviceRegistro.verificarTelefono(this.registro.telefono).subscribe((resp) => {
              if (resp.existe) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Teléfono duplicado',
                  text: 'El número de teléfono ingresado ya existe en la base de datos.',
                });
                return;
              }
      
              // Si todo es válido, agregar el administrador
              this.serviceRegistro.agregar(this.registro).subscribe({
                next: (response) => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Su registro se ha realizado exitosamente.',
                  }).then(() => {
                    this._router.navigate(['/login']);
                  });
                },
                error: (err) => {
                  console.error('Error en enviar datos del registro:', err);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al generar el registro.',
                  });
                },
              });
            });
          });
        });
      }
    
}

