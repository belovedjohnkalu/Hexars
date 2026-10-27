-- Room totals are sharded: an active room never serializes all writers on one row.
CREATE TABLE ion_chess_room_sizes (
  room_id text NOT NULL,
  shard smallint NOT NULL CHECK(shard BETWEEN 0 AND 63),
  characters bigint NOT NULL DEFAULT 0 CHECK(characters>=0),
  PRIMARY KEY(room_id,shard)
);
INSERT INTO ion_chess_room_sizes(room_id,shard,characters)
SELECT room_id,get_byte(uuid_send(id),0)%64,sum(char_length(title)+char_length(body)+reply_characters)
FROM ion_chess_topics WHERE visibility='visible' GROUP BY room_id,get_byte(uuid_send(id),0)%64;
