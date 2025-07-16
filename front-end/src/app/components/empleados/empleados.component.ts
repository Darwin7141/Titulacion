
import { Component, OnInit } from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ValidacionesService } from '../../services/validaciones.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-empleados',
  standalone: false,
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {
  empleado = {
    codigoempleado: '',
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    idcargo: '',
    
    
  };

  empleados: any[]=[];

  cargo: any[] = [];
  esEdicion = false;

  constructor(
    
    private _serviceEmpleado: EmpleadosService,
    private _router:Router,
    private validaciones: ValidacionesService,
    private dialogRef: MatDialogRef<EmpleadosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit():void {
     if (this.data?.emp) {
    this.empleado= { ...this.data.emp };   // precargar
    this.esEdicion     = true;
  }

    this._serviceEmpleado.getCargosEmpleados().subscribe({
      next: (data) => {
        this.cargo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });

    this._serviceEmpleado.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });
  }
  agregar() {
    if (!this.validaciones.validarCedulaEcuador(this.empleado.ci)) {
             Swal.fire({
               icon: 'error',
               title: 'Cédula no válida',
               text: 'La cédula ingresada no es válida.',
             });
             return;
           }
         
           if (!this.empleado.nombre.trim()) {
             Swal.fire({
               icon: 'error',
               title: 'Nombre obligatorio',
               text: 'El nombre es obligatorio.',
             });
             return;
           }
         
           if (!this.empleado.direccion.trim()) {
             Swal.fire({
               icon: 'error',
               title: 'Dirección obligatoria',
               text: 'La dirección es obligatoria.',
             });
             return;
           }
         
           if (!this.validaciones.validarEmail(this.empleado.e_mail)) {
             Swal.fire({
               icon: 'error',
               title: 'Correo no válido',
               text: 'El correo electrónico no es válido.',
             });
             return;
           }
         
           if (!this.validaciones.validarTelefono(this.empleado.telefono)) {
             Swal.fire({
               icon: 'error',
               title: 'Teléfono no válido',
               text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
             });
             return;
           }
         
           // Lógica de verificación y envío
           this._serviceEmpleado.verificarCedula(this.empleado.ci).subscribe((resp) => {
             if (resp.existe) {
               Swal.fire({
                 icon: 'warning',
                 title: 'Cédula duplicada',
                 text: 'La cédula ingresada ya existe en la base de datos.',
               });
               return;
             }
             this._serviceEmpleado.verificarEmail(this.empleado.e_mail).subscribe((resp) => {
               if (resp.existe) {
                 Swal.fire({
                   icon: 'warning',
                   title: 'Correo duplicado',
                   text: 'El correo ingresado ya existe en la base de datos.',
                 });
                 return;
               }
               this._serviceEmpleado.verificarTelefono(this.empleado.telefono).subscribe((resp) => {
                 if (resp.existe) {
                   Swal.fire({
                     icon: 'warning',
                     title: 'Teléfono duplicado',
                     text: 'El número de teléfono ingresado ya existe en la base de datos.',
                   });
                   return;
                 }
         
                 // Si todo es válido, agregar el administrador
                 this._serviceEmpleado.agregar(this.empleado).subscribe({
                         next: () => {
                           Swal.fire({ icon: 'success', title: 'Éxito', text: 'Empleado agregado correctamente.' })
                               .then(() => this.dialogRef.close('added'));   // ⬅️  cerramos pasando flag
                         },
                   error: (err) => {
                     console.error('Error en enviar datos del empleado:', err);
                     Swal.fire({
                       icon: 'error',
                       title: 'Error',
                       text: 'Ocurrió un error al agregar el empleado.',
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
    if (!this.validaciones.validarCedulaEcuador(this.empleado.ci)) {
        Swal.fire({
          icon: 'error',
          title: 'Cédula no válida',
          text: 'La cédula ingresada no es válida.',
        });
        return;
      }
    
      if (!this.empleado.nombre.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Nombre obligatorio',
          text: 'El nombre es obligatorio.',
        });
        return;
      }
    
      if (!this.empleado.direccion.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Dirección obligatoria',
          text: 'La dirección es obligatoria.',
        });
        return;
      }
  
    
  
      if (!this.validaciones.validarEmail(this.empleado.e_mail)) {
        Swal.fire({
          icon: 'error',
          title: 'Correo no válido',
          text: 'El correo electrónico no es válido.',
        });
        return;
      }
    
      if (!this.validaciones.validarTelefono(this.empleado.telefono)) {
        Swal.fire({
          icon: 'error',
          title: 'Teléfono no válido',
          text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
        });
        return;
      }
    
    const peticion$ = this.esEdicion
        ? this._serviceEmpleado.editarEmpleado(this.empleado)
        : this._serviceEmpleado.agregar(this.empleado);
  
    peticion$.subscribe({
      next : () => {
        Swal.fire({
          icon : 'success',
          title: 'Éxito',
          text : this.esEdicion
                 ? 'Empleado actualizado correctamente.'
                 : 'Empleado agregado correctamente.'
        }).then(() => this.dialogRef.close('saved'));
      },
      error: err => {
        console.error('Error al guardar empleado:', err);
        Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al guardar.' });
      }
    });
  
        }
}