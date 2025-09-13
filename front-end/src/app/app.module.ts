import { NgModule } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table'; 
import {MatDividerModule} from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';


import { LayoutModule }     from '@angular/cdk/layout';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatBadgeModule }     from '@angular/material/badge';
import { MatMenuModule }      from '@angular/material/menu';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatNativeDateModule }  from '@angular/material/core';









import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { AppRouting } from './routes/routing';
import { LoginComponent } from './components/login/login.component';
import { ListComponent } from './components/list/list.component';
import { AdminComponent } from './components/admin/admin.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { EmpleadosComponent } from './components/empleados/empleados.component';
import { ListadoempleadosComponent } from './components/listadoempleados/listadoempleados.component';
import { AdministradorComponent } from './components/administrador/administrador.component';
import { ListaadministradorComponent } from './components/listaadministrador/listaadministrador.component';
import { ProveedoresComponent } from './components/proveedores/proveedores.component';
import { ListarproveedorComponent } from './components/listarproveedor/listarproveedor.component';
import { ProductosComponent } from './components/productos/productos.component';
import { ListarproductosComponent } from './components/listarproductos/listarproductos.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { ListarusuariosComponent } from './components/listarusuarios/listarusuarios.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { ListarclientesComponent } from './components/listarclientes/listarclientes.component';
import { CargosComponent } from './components/cargos/cargos.component';
import { ListarcargosComponent } from './components/listarcargos/listarcargos.component';
import { TipocateringComponent } from './components/tipocatering/tipocatering.component';
import { ListacateringComponent } from './components/listacatering/listacatering.component';
import { ServiciocateringComponent } from './components/serviciocatering/serviciocatering.component';
import { ListarservicioComponent } from './components/listarservicio/listarservicio.component';
import { ListarmenusComponent } from './components/listarmenus/listarmenus.component';
import { MenusComponent } from './components/menus/menus.component';
import { RecuperarContrasenaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { RestablecerContrasenaComponent } from './components/restablecer-contrasena/restablecer-contrasena.component';
import { ServiciosClienteComponent } from './componentsCliente/servicios-cliente/servicios-cliente.component';
import { InicioClienteComponent } from './componentsCliente/inicio-cliente/inicio-cliente.component';
import { DialogoComponent } from './validaciones/dialogo/dialogo.component';
import { RegistroClienteComponent } from './componentsCliente/registro-cliente/registro-cliente.component';
import { InicioEmpleadoComponent } from './componentsEmpleado/inicio-empleado/inicio-empleado.component';
import { MenusClienteComponent } from './componentsCliente/menus-cliente/menus-cliente.component';
import { ListarCategoriasComponent } from './components/listar-categorias/listar-categorias.component';
import { CategoriaProductosComponent } from './components/categoria-productos/categoria-productos.component';
import { AgendarReservaComponent } from './componentsCliente/agendar-reserva/agendar-reserva.component';
import { MisReservasComponent } from './componentsCliente/mis-reservas/mis-reservas.component';
import { EditarReservaComponent } from './componentsCliente/editar-reserva/editar-reserva.component';
import { ListarReservasComponent } from './components/listar-reservas/listar-reservas.component';
import { ContactoComponent } from './componentsCliente/contacto/contacto.component';
import { AsistenteVirtualComponent } from './componentsCliente/asistente-virtual/asistente-virtual.component';
import { GestionProductosComponent } from './components/gestion-productos/gestion-productos.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PagosDialogComponent } from './components/pagos-dialog/pagos-dialog.component';
import { NotificacionPagoComponent } from './components/notificacion-pago/notificacion-pago.component';
import { ReestablecerDialogoComponent } from './components/reestablecer-dialogo/reestablecer-dialogo.component';



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    ListComponent,
    AdminComponent,
    InicioComponent,
    EmpleadosComponent,
    ListadoempleadosComponent,
    AdministradorComponent,
    ListaadministradorComponent,
    ProveedoresComponent,
    ListarproveedorComponent,
    ProductosComponent,
    ListarproductosComponent,
    UsuariosComponent,
    ListarusuariosComponent,
    ClientesComponent,
    ListarclientesComponent,
    CargosComponent,
    ListarcargosComponent,
    TipocateringComponent,
    ListacateringComponent,
    ServiciocateringComponent,
    ListarservicioComponent,
    ListarmenusComponent,
    MenusComponent,
    RecuperarContrasenaComponent,
    RestablecerContrasenaComponent,
    ServiciosClienteComponent,
    InicioClienteComponent,
    DialogoComponent,
    RegistroClienteComponent,
    InicioEmpleadoComponent,
    MenusClienteComponent,
    ListarCategoriasComponent,
    CategoriaProductosComponent,
    AgendarReservaComponent,
    MisReservasComponent,
    EditarReservaComponent,
    ListarReservasComponent,
    ContactoComponent,
    AsistenteVirtualComponent,
    GestionProductosComponent,
    PagosDialogComponent,
    NotificacionPagoComponent,
    ReestablecerDialogoComponent,
    
    
  
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatIconModule,
    AppRouting,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatListModule,
    CommonModule,
    MatTableModule,
    MatDividerModule,
    MatCardModule,
    LayoutModule,
    MatMenuModule,
    MatToolbarModule,
    MatBadgeModule,
    NgChartsModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule
    
    
    
    
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    
  ],
  bootstrap: [AppComponent],
  
})
export class AppModule { }
