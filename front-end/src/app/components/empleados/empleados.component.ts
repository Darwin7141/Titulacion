
import { Component, OnInit } from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-empleados',
  standalone: false,
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {
  empleado = {
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    idcargo: '',
    contrasenia: ''
    
  };

  empleados: any[]=[];

  cargo: any[] = [];

  constructor(
    
    private _serviceEmpleado: EmpleadosService,
      private _router:Router) {}

  ngOnInit():void {
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
    this._serviceEmpleado.agregar(this.empleado).subscribe({
      next: (response) => {
       
          localStorage.setItem('identity_user', JSON.stringify(response.usuario));
          this._router.navigate(['/listaEmpleados']);
        
        // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
      },
      error: (err) => {
        console.error('Error en enviar datos del empleados:', err);
        // Aquí puedes manejar el error, como mostrar un mensaje al usuario
      },
    });
  }
}