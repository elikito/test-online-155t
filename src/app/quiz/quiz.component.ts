import { Component, OnInit } from '@angular/core';
import { QuizService } from '../services/quiz.service';
import { Pregunta } from '../models/pregunta.model';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  preguntas: Pregunta[] = [];
  respuestasUsuario: { [key: number]: string } = {};
  mostrarResultado = false;
  aciertos = 0;

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    this.quizService.getPreguntas().subscribe(data => {
      this.preguntas = data;
    });
  }

  seleccionarRespuesta(id: number, opcion: string): void {
    this.respuestasUsuario[id] = opcion;
  }

  enviar(): void {
    this.aciertos = this.preguntas.filter(p =>
      this.respuestasUsuario[p.id] === p.respuesta_correcta
    ).length;
    this.mostrarResultado = true;
  }
}
