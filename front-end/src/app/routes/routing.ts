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
import { ListarservicioComponent } from '../components/listarservicio/listarservicio.component';
import { ServiciocateringComponent } from '../components/serviciocatering/serviciocatering.component';
import { MenusComponent } from '../components/menus/menus.component';
import { ListarmenusComponent } from '../components/listarmenus/listarmenus.component';
import { RecuperarContrasenaComponent } from '../components/recuperar-contrasena/recuperar-contrasena.component';
import { RestablecerContrasenaComponent } from '../components/restablecer-contrasena/restablecer-contrasena.component';
import { ServiciosClienteComponent } from '../componentsCliente/servicios-cliente/servicios-cliente.component';
import { InicioClienteComponent } from '../componentsCliente/inicio-cliente/inicio-cliente.component';
import { RegistroClienteComponent } from '../componentsCliente/registro-cliente/registro-cliente.component';
import { InicioEmpleadoComponent } from '../componentsEmpleado/inicio-empleado/inicio-empleado.component';
import { MenusClienteComponent } from '../componentsCliente/menus-cliente/menus-cliente.component';
import { ListarCategoriasComponent } from '../components/listar-categorias/listar-categorias.component';
import { CategoriaProductosComponent } from '../components/categoria-productos/categoria-productos.component';
import { AgendarReservaComponent } from '../componentsCliente/agendar-reserva/agendar-reserva.component';
import { MisReservasComponent } from '../componentsCliente/mis-reservas/mis-reservas.component';
import { EditarReservaComponent } from '../componentsCliente/editar-reserva/editar-reserva.component';
import { ListarReservasComponent } from '../components/listar-reservas/listar-reservas.component';
import { AsistenteVirtualComponent } from '../componentsCliente/asistente-virtual/asistente-virtual.component';


const app_routes:Routes=[
    {path:'home', component:HomeComponent, canActivate:[GuardiaService]},
    {path:'inicio', component:InicioComponent, canActivate:[GuardiaService]},   
    {path:'login', component:LoginComponent},
    {path:'registroCliente', component:RegistroClienteComponent},
    {path:'admin', component:AdminComponent, canActivate:[GuardiaService],
        children:[
            {path:'list', component:ListComponent},
           // {path:'empleados', component:EmpleadosComponent},
        ]},
       
    {path:'administrador', component:AdministradorComponent, canActivate:[GuardiaService]},
    {path:'empleados', component:EmpleadosComponent, canActivate:[GuardiaService]},
    {path:'proveedores', component:ProveedoresComponent, canActivate:[GuardiaService]},
    {path:'productos', component:ProductosComponent, canActivate:[GuardiaService]},
    {path:'usuarios', component:UsuariosComponent, canActivate:[GuardiaService]},   
    {path:'clientes', component:ClientesComponent, canActivate:[GuardiaService]},  
    {path:'cargos', component:CargosComponent, canActivate:[GuardiaService]},  
    {path:'tipocatering', component:TipocateringComponent, canActivate:[GuardiaService]},  
    {path:'servicios', component:ServiciocateringComponent, canActivate:[GuardiaService]},  
    {path:'menus', component:MenusComponent, canActivate:[GuardiaService]},
    {path:'recuperar-contrasena', component:RecuperarContrasenaComponent},
    {path:'restablecer-contrasena/:token', component:RestablecerContrasenaComponent},
    {path:'categoriaProductos', component:CategoriaProductosComponent},
    { path: 'productos/categoria/:idCategoria', component: ProductosComponent },



    {path:'serviciosClientes', component:ServiciosClienteComponent, canActivate:[GuardiaService]},
  //  {path:'serviciosClientes/:idservicio', component:ServiciosClienteComponent, canActivate:[GuardiaService]},
    {path:'inicioCliente', component:InicioClienteComponent, canActivate:[GuardiaService]},  
    {path:'inicioEmpleado', component:InicioEmpleadoComponent, canActivate:[GuardiaService]}, 
    {path:'menusCliente/:idservicio', component:MenusClienteComponent, canActivate:[GuardiaService]}, 
    {path:'generarReserva', component:AgendarReservaComponent, canActivate:[GuardiaService]}, 
    {path:'misReservas', component:MisReservasComponent, canActivate:[GuardiaService]},
    {path:'editarReservas/:idreserva', component:EditarReservaComponent, canActivate:[GuardiaService]},
    {path:'asistente', component:AsistenteVirtualComponent, canActivate:[GuardiaService]},



    {path:'listaEmpleados', component:ListadoempleadosComponent, canActivate:[GuardiaService]},
    {path:'listaAdministrador', component:ListaadministradorComponent, canActivate:[GuardiaService]},
    {path:'listaProveedor', component:ListarproveedorComponent, canActivate:[GuardiaService]},
    {path:'listaProductos', component:ListarproductosComponent, canActivate:[GuardiaService]},
    {path:'listaUsuarios', component:ListarusuariosComponent, canActivate:[GuardiaService]},
    {path:'listaClientes', component:ListarclientesComponent, canActivate:[GuardiaService]},
    {path:'listaCargos', component:ListarcargosComponent, canActivate:[GuardiaService]},
    {path:'listaTipos', component:ListacateringComponent, canActivate:[GuardiaService]},
    {path:'listaServicios', component:ListarservicioComponent, canActivate:[GuardiaService]},
    {path:'listaMenus', component:ListarmenusComponent, canActivate:[GuardiaService]},
    {path:'listaMenus/:idservicio', component: ListarmenusComponent, canActivate:[GuardiaService] },
    {path:'listaCategorias', component:ListarCategoriasComponent, canActivate:[GuardiaService]},
    {path:'listaProductos/categoria/:idCategoria', component: ListarproductosComponent},
    {path:'listaReservas', component: ListarReservasComponent},


    
    {path:'**', pathMatch:'full',redirectTo:''}
]

export const AppRouting = RouterModule.forRoot(app_routes);