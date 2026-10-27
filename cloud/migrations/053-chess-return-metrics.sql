-- One row per actual signed-in chess player; no device, IP or browsing history.
-- Start observing now. Never invent historical visits from archived game dates.
CREATE TABLE ion_chess_players (
  user_id integer PRIMARY KEY REFERENCES users(id),
  first_day date NOT NULL,
  last_day date NOT NULL,
  returned_7d boolean NOT NULL DEFAULT false,
  CHECK(last_day>=first_day)
);
CREATE INDEX ion_chess_players_active ON ion_chess_players(last_day);
CREATE INDEX ion_chess_players_cohort ON ion_chess_players(first_day,returned_7d);
