-- Correr después de scripts/seed-questions.mjs: las jugadas ya guardadas apuntan a EST-0001..0005.
alter table plays
  add constraint plays_question_id_fkey
  foreign key (question_id) references questions (id) on delete restrict;
