import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pregunta } from '../models/pregunta.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private jsonUrl = 'assets/2024_A_libre.json';

  constructor(private http: HttpClient) {}

  getPreguntas(): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(this.jsonUrl);
  }
}
