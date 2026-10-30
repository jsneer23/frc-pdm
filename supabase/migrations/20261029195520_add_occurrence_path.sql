create type export_status as enum ('exporting', 'done', 'failed');

alter table part_exports
  add column occurrence_path text not null check (occurrence_path <> ''),
  add column translation_id text unique,
  add column status export_status not null default 'exporting',
  add column failure_reason text;