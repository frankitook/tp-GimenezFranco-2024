import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CrearReservaService } from '../service/crear-reserva.service';
import { TiposHabitacionService } from '../service/tiposhabitacion.service';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';

@Component({
  selector: 'app-mostrar-habitaciones-disponibles',
  templateUrl: './mostrar-habitaciones-disponibles.component.html',
  styleUrls: ['./mostrar-habitaciones-disponibles.component.css']
})
export class MostrarHabitacionesDisponiblesComponent implements OnInit {
  habitaciones: any[] = [];
  tiposHabitacion: any[] = [];
  errorMessage: string = '';
  checkin: string = '';
  checkout: string = '';
  people: string = '';
  idLocalidad: number = 0;
  authToken: string | null = localStorage.getItem('authToken'); 
  idCliente: string | null = localStorage.getItem('idCliente');

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private reservaService: CrearReservaService,
    private tiposHabitacionService: TiposHabitacionService,
    private router: Router,
    private dialog: MatDialog 
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.checkin = params['checkin'];
      this.checkout = params['checkout'];
      this.people = params['people'];
      this.idLocalidad = Number(params['idLocalidad']); 

      if (this.checkin && this.checkout && this.people && this.idLocalidad) {
        const url = `http://localhost:3000/habitaciones/disponibles/${this.checkin}/${this.checkout}/${this.people}/${this.idLocalidad}`;
        this.http.get<any[]>(url)
          .subscribe((habitaciones: any[]) => {
            this.habitaciones = habitaciones;
            console.log('Habitaciones disponibles:', this.habitaciones);
          }, error => {
            this.errorMessage = 'Error al obtener las habitaciones disponibles';
            console.error('Error en la solicitud de habitaciones:', error);
          });
      } else {
        this.errorMessage = 'Datos de búsqueda incompletos';
      }

      // Cargar tipos de habitación
      this.tiposHabitacionService.getTiposHabitacion().subscribe({
        next: (tipos: any[]) => {
          this.tiposHabitacion = tipos;
        },
        error: (err) => {
          console.error('Error al obtener tipos de habitación:', err);
        }
      });
    });
  }

  getTipoNombre(idTipo: number): string {
    const tipo = this.tiposHabitacion.find(t => t.id === idTipo);
    return tipo ? tipo.denominacion : 'Desconocido';
  }

  reservarHabitacion(nroHabitacion: number): void {
    
    if (!this.authToken) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      this.router.navigate(['/login']); 
      return;
    }

   
    if (!this.checkin || !this.checkout || !this.idLocalidad || !nroHabitacion) {
      alert('Datos incompletos para la reserva.');
      return;
    }

    const reservaData = {
      nroHabitacion: nroHabitacion,
      fechaIngreso: this.checkin,
      fechaEgreso: this.checkout,
      idLocalidad: this.idLocalidad,
      idCli: this.idCliente 
    };

    this.reservaService.reservarHabitacion(reservaData).subscribe({
      next: (response) => {
        
        const dialogRef = this.dialog.open(SuccessDialogComponent, {
          data: { message: 'Su reserva fue registrada con éxito.' }
        });

       
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/misreservas']);
        });
      },
      error: (err) => {
      
        alert('Error al realizar la reserva. Intenta nuevamente.');
        console.error('Error en la reserva:', err);
      }
    });
  }
}
