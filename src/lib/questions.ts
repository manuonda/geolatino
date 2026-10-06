import questions from "@/data/questions.json";
import type { PublicQuestion, Question } from "@/types/question";

const bank = questions as Question[];

export function getAllQuestions(): Question[] {
  return bank;
}

export function getQuestionById(id: string): Question | undefined {
  return bank.find((question) => question.id === id);
}

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    orden: question.orden,
    pregunta: question.pregunta,
    deporte: question.deporte,
    dificultad: question.dificultad,
    pistas: (question.pistas ?? []).slice(0, 3),
  };
}

export function getPublicRound(date: string): PublicQuestion[] {
  const assigned = bank.filter((question) => question.fecha === date);
  const source = assigned.length > 0 ? assigned : bank.slice(0, 5);

  return [...source]
    .sort((a, b) => a.orden - b.orden)
    .map(toPublicQuestion);
}
