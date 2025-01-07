import {RouterModule, Routes} from '@angular/router';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { AdminComponent } from '../components/admin/admin.component';
import { ListComponent } from '../components/list/list.component';
import { GuardiaService } from '../services/guardia.service';
import { InicioComponent } from '../components/inicio/inicio.component';
import { EmpleadosComponent } from '../components/empleados/empleados.component';
import { ListadoempleadosComponent } from '../components/listadoempleados/listadoempleados.component';
import { Component } from '@angular/core';
import { AdministradorComponent } from '../components/administrador/administrador.component';
import { ListaadministradorComponent } from '../components/listaadministrador/listaadministrador.component';
import { ListarproveedorComponent } from '../components/listarproveedor/listarproveedor.component';
import { ProveedoresComponent } from '../components/proveedores/proveedores.component';
import { ProductosComponent } from '../components/productos/productos.component';
import { ListarproductosComponent } from '../components/listarproductos/listarproductos.component';
import { ListarusuariosComponent } from '../components/listarusuarios/listarusuarios.component';
import { UsuariosComponent } from '../components/usuarios/usuarios.component';
import { ListarclientesComponent } from '../components/listarclientes/listarclientes.component';
import { ClientesComponent } from '../components/clientes/clientes.component';
import { CargosComponent } from '../components/cargos/cargos.component';
import { ListarcargosComponent } from '../components/listarcargos/listarcargos.component';
import { ListacateringComponent } from '../components/listacatering/listacatering.component';
import { TipocateringComponent } from '../components/tipocatering/tipocatering.component';



const app_routes:Routes=[
    {path:'home', component:HomeComponent},
    {path:'inicio', component:InicioComponent},   
    {path:'login', component:LoginComponent},
    {path:'admin', component:AdminComponent, canActivate:[GuardiaService],
        children:[
            {path:'list', component:ListComponent},
           // {path:'empleados', component:EmpleadosComponent},
        ]},
    {path:'administrador', component:AdministradorComponent},
    {path:'empleados', component:EmpleadosComponent},
    {path:'proveedores', component:ProveedoresComponent},
    {path:'productos', component:ProductosComponent},
    {path:'usuarios', component:UsuariosComponent},   
    {path:'clientes', component:ClientesComponent},  
    {path:'cargos', component:CargosComponent},  
    {path:'tipocatering', component:TipocateringComponent},  
   


    {path:'listaEmpleados', component:ListadoempleadosComponent},
    {path:'listaAdministrador', component:ListaadministradorComponent},
    {path:'listaProveedor', component:ListarproveedorComponent},
    {path:'listaProductos', component:ListarproductosComponent},
    {path:'listaUsuarios', component:ListarusuariosComponent},
    {path:'listaClientes', component:ListarclientesComponent},
    {path:'listaCargos', component:ListarcargosComponent},
    {path:'listaTipos', component:ListacateringComponent},
    
    {path:'**', pathMatch:'full',redirectTo:''}
]

export const AppRouting=RouterModule.forRoot(app_routes);