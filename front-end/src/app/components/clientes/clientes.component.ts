import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { ValidacionesService } from '../../services/validaciones.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-clientes',
  standalone: false,
  
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes = {
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    contrasenia: '',
    
  };
    constructor(
      
      private clienteService: ClientesService,
      private validaciones: ValidacionesService,
        private _router:Router,
      private dialogRef: MatDialogRef<ClientesComponent> ) {}
  
    ngOnInit():void {
      
    }
   agregar() {
       if (!this.validaciones.validarCedulaEcuador(this.clientes.ci)) {
         Swal.fire({
           icon: 'error',
           title: 'Cédula no válida',
           text: 'La cédula ingresada no es válida.',
         });
         return;
       }
     
       if (!this.clientes.nombre.trim()) {
         Swal.fire({
           icon: 'error',
           title: 'Nombre obligatorio',
           text: 'El nombre es obligatorio.',
         });
         return;
       }
     
       if (!this.clientes.direccion.trim()) {
         Swal.fire({
           icon: 'error',
           title: 'Dirección obligatoria',
           text: 'La dirección es obligatoria.',
         });
         return;
       }
     
       if (!this.validaciones.validarEmail(this.clientes.e_mail)) {
         Swal.fire({
           icon: 'error',
           title: 'Correo no válido',
           text: 'El correo electrónico no es válido.',
         });
         return;
       }
     
       if (!this.validaciones.validarTelefono(this.clientes.telefono)) {
         Swal.fire({
           icon: 'error',
           title: 'Teléfono no válido',
           text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
         });
         return;
       }
     
       // Lógica de verificación y envío
       this.clienteService.verificarCedula(this.clientes.ci).subscribe((resp) => {
         if (resp.existe) {
           Swal.fire({
             icon: 'warning',
             title: 'Cédula duplicada',
             text: 'La cédula ingresada ya existe en la base de datos.',
           });
           return;
         }
         this.clienteService.verificarEmail(this.clientes.e_mail).subscribe((resp) => {
           if (resp.existe) {
             Swal.fire({
               icon: 'warning',
               title: 'Correo duplicado',
               text: 'El correo ingresado ya existe en la base de datos.',
             });
             return;
           }
           this.clienteService.verificarTelefono(this.clientes.telefono).subscribe((resp) => {
             if (resp.existe) {
               Swal.fire({
                 icon: 'warning',
                 title: 'Teléfono duplicado',
                 text: 'El número de teléfono ingresado ya existe en la base de datos.',
               });
               return;
             }
     
             // Si todo es válido, agregar el administrador
             this.clienteService.agregar(this.clientes).subscribe({
                     next: () => {
                       Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cliente agregado correctamente.' })
                           .then(() => this.dialogRef.close('added'));   // ⬅️  cerramos pasando flag
                     },
               error: (err) => {
                 console.error('Error en enviar datos del cliente:', err);
                 Swal.fire({
                   icon: 'error',
                   title: 'Error',
                   text: 'Ocurrió un error al agregar el cliente.',
                 });
               },
             });
           });
         });
       });
     }
     cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }
   }