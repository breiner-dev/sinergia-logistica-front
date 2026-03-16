import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { EnviosService } from './services/envios.service';
import { ClientesService } from './services/clientes.service';
import {
  CrearEnvioMaritimoRequest,
  CrearEnvioTerrestreRequest,
  EnvioResponse,
} from './models/envio.models';
import { ClienteResponse } from './models/cliente.models';

type TipoEnvio = 'terrestre' | 'maritimo';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private enviosService = inject(EnviosService);
  private clientesService = inject(ClientesService);

  readonly autenticado = this.authService.autenticado;

  tabActiva = signal<TipoEnvio>('terrestre');
  envios = signal<EnvioResponse[]>([]);
  clientes = signal<ClienteResponse[]>([]);
  cargando = signal(false);
  cargandoClientes = signal(false);
  loginError = signal('');
  loginCargando = signal(false);
  editandoId = signal<string | null>(null);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  terrestreForm = this.fb.group({
    clienteId: ['', Validators.required],
    tipoProducto: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    fechaEntrega: ['', Validators.required],
    precioEnvio: [100, [Validators.required, Validators.min(1)]],
    nombreBodega: ['', Validators.required],
    placaVehiculo: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}[0-9]{3}$/)]],
    numeroGuia: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]],
  });

  maritimoForm = this.fb.group({
    clienteId: ['', Validators.required],
    tipoProducto: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    fechaEntrega: ['', Validators.required],
    precioEnvio: [200, [Validators.required, Validators.min(1)]],
    nombrePuerto: ['', Validators.required],
    numeroFlota: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}[0-9]{4}[A-Z]$/)]],
    numeroGuia: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]],
  });

  precioNormalTerrestre = computed(() => {
    const cantidad = Number(this.terrestreForm.get('cantidad')?.value ?? 1);
    const precio = Number(this.terrestreForm.get('precioEnvio')?.value ?? 100);
    return cantidad * precio;
  });

  precioDescuentoTerrestre = computed(() => {
    const cantidad = Number(this.terrestreForm.get('cantidad')?.value ?? 1);
    const normal = this.precioNormalTerrestre();
    return cantidad > 10 ? normal * 0.95 : normal;
  });

  precioNormalMaritimo = computed(() => {
    const cantidad = Number(this.maritimoForm.get('cantidad')?.value ?? 1);
    const precio = Number(this.maritimoForm.get('precioEnvio')?.value ?? 200);
    return cantidad * precio;
  });

  precioDescuentoMaritimo = computed(() => {
    const cantidad = Number(this.maritimoForm.get('cantidad')?.value ?? 1);
    const normal = this.precioNormalMaritimo();
    return cantidad > 10 ? normal * 0.97 : normal;
  });

  ngOnInit(): void {
    if (this.autenticado()) {
      this.cargarDatosIniciales();
    }
  }

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError.set('');
    this.loginCargando.set(true);

    const payload = {
      username: this.loginForm.get('username')?.value ?? '',
      password: this.loginForm.get('password')?.value ?? '',
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.loginCargando.set(false);
        this.cargarDatosIniciales();
      },
      error: (error) => {
        console.error('Error login', error);
        this.loginCargando.set(false);
        this.loginError.set('Credenciales inválidas o error al iniciar sesión.');
      },
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.envios.set([]);
    this.clientes.set([]);
    this.editandoId.set(null);
  }

  cargarDatosIniciales(): void {
    this.listarClientes();
    this.listarEnvios();
  }

  cambiarTab(tipo: TipoEnvio): void {
    this.tabActiva.set(tipo);
  }

  listarClientes(): void {
    this.cargandoClientes.set(true);
    this.clientesService.listar().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargandoClientes.set(false);
      },
      error: (error) => {
        console.error('Error al listar clientes', error);
        this.cargandoClientes.set(false);
      },
    });
  }

  listarEnvios(): void {
    this.cargando.set(true);
    this.enviosService.listar().subscribe({
      next: (data) => {
        this.envios.set(data.slice().reverse());
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al listar envíos', error);
        this.cargando.set(false);
      },
    });
  }

  registrarTerrestre(): void {
    if (this.terrestreForm.invalid) {
      this.terrestreForm.markAllAsTouched();
      return;
    }

    const payload: CrearEnvioTerrestreRequest = {
      clienteId: this.terrestreForm.get('clienteId')?.value ?? '',
      tipoProducto: this.terrestreForm.get('tipoProducto')?.value ?? '',
      cantidad: Number(this.terrestreForm.get('cantidad')?.value ?? 1),
      fechaEntrega: this.terrestreForm.get('fechaEntrega')?.value ?? '',
      precioEnvio: Number(this.terrestreForm.get('precioEnvio')?.value ?? 0),
      nombreBodega: this.terrestreForm.get('nombreBodega')?.value ?? '',
      placaVehiculo: (this.terrestreForm.get('placaVehiculo')?.value ?? '').toUpperCase(),
      numeroGuia: this.terrestreForm.get('numeroGuia')?.value ?? '',
      tipoLogistica : "TERRESTRE"
    };

    if (this.editandoId()) {
      this.enviosService.actualizar(this.editandoId()!, payload).subscribe({
        next: (response) => {
          this.envios.update((actual) =>
            actual.map((item) => (item.id === response.id ? response : item))
          );
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar envío terrestre', error);
          alert('No se pudo actualizar el envío terrestre');
        },
      });
      return;
    }

    this.enviosService.crearTerrestre(payload).subscribe({
      next: (response) => {
        this.envios.update((actual) => [response, ...actual]);
        this.resetTerrestreForm();
      },
      error: (error) => {
        console.error('Error al registrar envío terrestre', error);
        alert('No se pudo registrar el envío terrestre');
      },
    });
  }

  registrarMaritimo(): void {
    if (this.maritimoForm.invalid) {
      this.maritimoForm.markAllAsTouched();
      return;
    }

    const payload: CrearEnvioMaritimoRequest = {
      clienteId: this.maritimoForm.get('clienteId')?.value ?? '',
      tipoProducto: this.maritimoForm.get('tipoProducto')?.value ?? '',
      cantidad: Number(this.maritimoForm.get('cantidad')?.value ?? 1),
      fechaEntrega: this.maritimoForm.get('fechaEntrega')?.value ?? '',
      precioEnvio: Number(this.maritimoForm.get('precioEnvio')?.value ?? 0),
      nombrePuerto: this.maritimoForm.get('nombrePuerto')?.value ?? '',
      numeroFlota: (this.maritimoForm.get('numeroFlota')?.value ?? '').toUpperCase(),
      numeroGuia: this.maritimoForm.get('numeroGuia')?.value ?? '',
      tipoLogistica: "MARITIMA"
    };

    if (this.editandoId()) {
      this.enviosService.actualizar(this.editandoId()!, payload).subscribe({
        next: (response) => {
          this.envios.update((actual) =>
            actual.map((item) => (item.id === response.id ? response : item))
          );
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar envío marítimo', error);
          alert('No se pudo actualizar el envío marítimo');
        },
      });
      return;
    }

    this.enviosService.crearMaritimo(payload).subscribe({
      next: (response) => {
        this.envios.update((actual) => [response, ...actual]);
        this.resetMaritimoForm();
      },
      error: (error) => {
        console.error('Error al registrar envío marítimo', error);
        alert('No se pudo registrar el envío marítimo');
      },
    });
  }

  editarEnvio(envio: EnvioResponse): void {
    this.editandoId.set(envio.id ?? null);

    if (envio.tipoLogistica === 'TERRESTRE') {
      this.tabActiva.set('terrestre');
      this.terrestreForm.patchValue({
        clienteId: envio.cliente?.id ?? '',
        tipoProducto: envio.tipoProducto,
        cantidad: envio.cantidad,
        fechaEntrega: envio.fechaEntrega,
        precioEnvio: envio.precioEnvio,
        nombreBodega: envio.nombreBodega ?? '',
        placaVehiculo: envio.placaVehiculo ?? '',
        numeroGuia: envio.numeroGuia,
      });
      return;
    }

    this.tabActiva.set('maritimo');
    this.maritimoForm.patchValue({
      clienteId: envio.cliente?.id ?? '',
      tipoProducto: envio.tipoProducto,
      cantidad: envio.cantidad,
      fechaEntrega: envio.fechaEntrega,
      precioEnvio: envio.precioEnvio,
      nombrePuerto: envio.nombrePuerto ?? '',
      numeroFlota: envio.numeroFlota ?? '',
      numeroGuia: envio.numeroGuia,
    });
  }

  eliminarEnvio(envio: EnvioResponse): void {
    if (!envio.id) {
      alert('No se puede eliminar porque el envío no tiene id.');
      return;
    }

    const confirmado = confirm(`¿Deseas eliminar el envío ${envio.numeroGuia}?`);
    if (!confirmado) {
      return;
    }

    this.enviosService.eliminar(envio.id).subscribe({
      next: () => {
        this.envios.update((actual) => actual.filter((item) => item.id !== envio.id));

        if (this.editandoId() === envio.id) {
          this.cancelarEdicion();
        }
      },
      error: (error) => {
        console.error('Error al eliminar envío', error);
        alert('No se pudo eliminar el envío');
      },
    });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.resetTerrestreForm();
    this.resetMaritimoForm();
  }

  campoInvalido(form: TipoEnvio, campo: string): boolean {
    if (form === 'terrestre') {
      const control = this.terrestreForm.get(campo);
      return !!control && control.invalid && (control.dirty || control.touched);
    }

    const control = this.maritimoForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  formatearPrecio(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(valor);
  }

  obtenerNombreCliente(clienteId: string): string {
    const cliente = this.clientes().find((c) => c.id === clienteId);
    return cliente?.nombre ?? clienteId;
  }

  private resetTerrestreForm(): void {
    this.terrestreForm.reset({
      clienteId: '',
      tipoProducto: '',
      cantidad: 1,
      fechaEntrega: '',
      precioEnvio: 100,
      nombreBodega: '',
      placaVehiculo: '',
      numeroGuia: '',
    });
  }

  private resetMaritimoForm(): void {
    this.maritimoForm.reset({
      clienteId: '',
      tipoProducto: '',
      cantidad: 1,
      fechaEntrega: '',
      precioEnvio: 200,
      nombrePuerto: '',
      numeroFlota: '',
      numeroGuia: '',
    });
  }
}