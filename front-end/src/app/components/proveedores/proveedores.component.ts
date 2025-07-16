import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { ValidacionesService } from '../../services/validaciones.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-proveedores',
  standalone: false,
  
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {
  proveedor = {
    codigoproveedor: '',
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    
    
  };

  esEdicion = false;
    constructor(
      
      private serviceProv: ProveedoresService,
        private _router:Router,
      private validaciones: ValidacionesService,
    private dialogRef: MatDialogRef<ProveedoresComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any ) {}
  
    ngOnInit():void {
      if (this.data?.prov) {
    this.proveedor = { ...this.data.prov };   // precargar
    this.esEdicion     = true;
  }
    }
    agregar() {
      if (!this.validaciones.validarCedulaEcuador(this.proveedor.ci)) {
               Swal.fire({
                 icon: 'error',
                 title: 'Cédula no válida',
                 text: 'La cédula ingresada no es válida.',
               });
               return;
             }
           
             if (!this.proveedor.nombre.trim()) {
               Swal.fire({
                 icon: 'error',
                 title: 'Nombre obligatorio',
                 text: 'El nombre es obligatorio.',
               });
               return;
             }
           
             if (!this.proveedor.direccion.trim()) {
               Swal.fire({
                 icon: 'error',
                 title: 'Dirección obligatoria',
                 text: 'La dirección es obligatoria.',
               });
               return;
             }
           
             if (!this.validaciones.validarEmail(this.proveedor.e_mail)) {
               Swal.fire({
                 icon: 'error',
                 title: 'Correo no válido',
                 text: 'El correo electrónico no es válido.',
               });
               return;
             }
           
             if (!this.validaciones.validarTelefono(this.proveedor.telefono)) {
               Swal.fire({
                 icon: 'error',
                 title: 'Teléfono no válido',
                 text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
               });
               return;
             }
           
             // Lógica de verificación y envío
             this.serviceProv.verificarCedula(this.proveedor.ci).subscribe((resp) => {
               if (resp.existe) {
                 Swal.fire({
                   icon: 'warning',
                   title: 'Cédula duplicada',
                   text: 'La cédula ingresada ya se encuentra registrada.',
                 });
                 return;
               }
               this.serviceProv.verificarEmail(this.proveedor.e_mail).subscribe((resp) => {
                 if (resp.existe) {
                   Swal.fire({
                     icon: 'warning',
                     title: 'Correo duplicado',
                     text: 'El correo ingresado ya se encuentra registrado.',
                   });
                   return;
                 }
                 this.serviceProv.verificarTelefono(this.proveedor.telefono).subscribe((resp) => {
                   if (resp.existe) {
                     Swal.fire({
                       icon: 'warning',
                       title: 'Teléfono duplicado',
                       text: 'El número de teléfono ingresado ya se encuentra registrado.',
                     });
                     return;
                   }
           
                   // Si todo es válido, agregar el administrador
                   this.serviceProv.agregar(this.proveedor).subscribe({
                           next: () => {
                             Swal.fire({ icon: 'success', title: 'Éxito', text: 'Proveedor agregado correctamente.' })
                                 .then(() => this.dialogRef.close('added'));   // ⬅️  cerramos pasando flag
                           },
                     error: (err) => {
                       console.error('Error en enviar datos del proveedor:', err);
                       Swal.fire({
                         icon: 'error',
                         title: 'Error',
                         text: 'Ocurrió un error al agregar el proveedor.',
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

      guardar(): void {
        if (!this.validaciones.validarCedulaEcuador(this.proveedor.ci)) {
            Swal.fire({
              icon: 'error',
              title: 'Cédula no válida',
              text: 'La cédula ingresada no es válida.',
            });
            return;
          }
        
          if (!this.proveedor.nombre.trim()) {
            Swal.fire({
              icon: 'error',
              title: 'Nombre obligatorio',
              text: 'El nombre es obligatorio.',
            });
            return;
          }
        
          if (!this.proveedor.direccion.trim()) {
            Swal.fire({
              icon: 'error',
              title: 'Dirección obligatoria',
              text: 'La dirección es obligatoria.',
            });
            return;
          }
      
      
          if (!this.validaciones.validarEmail(this.proveedor.e_mail)) {
            Swal.fire({
              icon: 'error',
              title: 'Correo no válido',
              text: 'El correo electrónico no es válido.',
            });
            return;
          }
        
          if (!this.validaciones.validarTelefono(this.proveedor.telefono)) {
            Swal.fire({
              icon: 'error',
              title: 'Teléfono no válido',
              text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
            });
            return;
          }
        
        const peticion$ = this.esEdicion
            ? this.serviceProv.editarProveedor(this.proveedor)
            : this.serviceProv.agregar(this.proveedor);
      
        peticion$.subscribe({
          next : () => {
            Swal.fire({
              icon : 'success',
              title: 'Éxito',
              text : this.esEdicion
                     ? 'Proveedor actualizado correctamente.'
                     : 'Proveedor agregado correctamente.'
            }).then(() => this.dialogRef.close('saved'));
          },
          error: err => {
            console.error('Error al guardar proveedor:', err);
            Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al guardar.' });
          }
        });
      
            }
  }