export interface CrearEnvioTerrestreRequest {
  clienteId: string;
  tipoProducto: string;
  cantidad: number;
  fechaEntrega: string;
  precioEnvio: number;
  nombreBodega: string;
  placaVehiculo: string;
  numeroGuia: string;
  tipoLogistica: string;
}

export interface CrearEnvioMaritimoRequest {
  clienteId: string;
  tipoProducto: string;
  cantidad: number;
  fechaEntrega: string;
  precioEnvio: number;
  nombrePuerto: string;
  numeroFlota: string;
  numeroGuia: string;
  tipoLogistica: string;
}

export interface EnvioResponse {
  id?: string;
  clienteId: string;
  tipoProducto: string;
  cantidad: number;
  fechaRegistro?: string;
  fechaEntrega: string;
  precioEnvio: number;
  porcentajeDescuento?: number;
  precioConDescuento?: number;
  tipoLogistica: 'TERRESTRE' | 'MARITIMO';
  estado?: string;
  nombreBodega?: string | null;
  placaVehiculo?: string | null;
  nombrePuerto?: string | null;
  numeroFlota?: string | null;
  numeroGuia: string;
}