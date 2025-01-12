import { NgModule } from '@angular/core';
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
    RestablecerContrasenaComponent
  
    
    
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
    MatOptionModule
    
    
    
    
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
