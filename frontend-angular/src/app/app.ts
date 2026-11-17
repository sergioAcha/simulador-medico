import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface RespuestaApi {
  estado: 'ok' | 'error';
  mensaje?: string;
  usuario?: Usuario;
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  modoRegistro = false;
  cargando = false;
  esError = false;
  mensaje = '';
  usuario: Usuario | null = null;

  formulario = this.formBuilder.group({
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  cambiarModo(modoRegistro: boolean): void {
    this.modoRegistro = modoRegistro;
    this.mensaje = '';
    const nombre = this.formulario.controls.nombre;
    const password = this.formulario.controls.password;
    if (modoRegistro) {
      nombre.setValidators(Validators.required);
      password.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      nombre.clearValidators();
      password.setValidators(Validators.required);
    }
    nombre.updateValueAndValidity();
    password.updateValueAndValidity();
  }

  campoInvalido(campo: 'nombre' | 'email' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  enviarFormulario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    const datos = this.formulario.getRawValue();
    const solicitud = this.modoRegistro
      ? this.http.post<RespuestaApi>('/auth/registro', {
          nombre: datos.nombre,
          email: datos.email,
          password: datos.password,
        })
      : this.http.post<RespuestaApi>('/auth/login', {
          email: datos.email,
          password: datos.password,
        });

    solicitud.subscribe({
      next: (respuesta) => {
        this.cargando = false;
        if (respuesta.estado !== 'ok') {
          this.esError = true;
          this.mensaje = respuesta.mensaje ?? 'No se pudo completar la solicitud.';
          return;
        }

        if (this.modoRegistro) {
          this.cambiarModo(false);
          this.formulario.controls.email.setValue(datos.email);
          this.formulario.controls.password.reset('');
          this.esError = false;
          this.mensaje = 'Cuenta creada. Ahora puedes iniciar sesión.';
          return;
        }

        if (!respuesta.usuario) {
          this.esError = true;
          this.mensaje = 'La respuesta del servidor no incluyó el usuario.';
          return;
        }

        this.usuario = respuesta.usuario;
        this.esError = false;
        this.mensaje = '';
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.esError = true;
        this.mensaje =
          error.error?.mensaje ??
          'No se pudo conectar con el backend. Verifica que esté activo.';
      },
    });
  }

  cerrarSesion(): void {
    this.usuario = null;
    this.formulario.controls.password.reset('');
  }
}
