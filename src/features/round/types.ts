import type { PublicQuestion } from "@/types/question";

export type RoundState = {
  date: string;
  questionIndex: number;
  questions: PublicQuestion[];
};
