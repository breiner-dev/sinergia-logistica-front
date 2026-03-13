import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CrearEnvioMaritimoRequest,
  CrearEnvioTerrestreRequest,
  EnvioResponse,
} from '../models/envio.models';

@Injectable({
  providedIn: 'root',
})
export class EnviosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/envios';

  crearTerrestre(payload: CrearEnvioTerrestreRequest): Observable<EnvioResponse> {
    return this.http.post<EnvioResponse>(`${this.apiUrl}/terrestre`, payload);
  }

  crearMaritimo(payload: CrearEnvioMaritimoRequest): Observable<EnvioResponse> {
    return this.http.post<EnvioResponse>(`${this.apiUrl}/maritimo`, payload);
  }

  listar(): Observable<EnvioResponse[]> {
    return this.http.get<EnvioResponse[]>(this.apiUrl);
  }
}