"use client";

import { useState } from "react";

export function useRound() {
  const [questionIndex, setQuestionIndex] = useState(0);

  return { questionIndex, setQuestionIndex };
}
