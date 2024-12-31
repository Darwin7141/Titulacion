import {RouterModule, Routes} from '@angular/router';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { AdminComponent } from '../components/admin/admin.component';
import { ListComponent } from '../components/list/list.component';
import { GuardiaService } from '../services/guardia.service';

const app_routes:Routes=[
    {path:'home', component:HomeComponent},
    {path:'admin', component:AdminComponent, canActivate:[GuardiaService],
        children:[
            {path:'list', component:ListComponent},
        ]},

    {path:'login', component:LoginComponent},
    {path:'**', pathMatch:'full',redirectTo:''}
]

export const AppRouting=RouterModule.forRoot(app_routes);