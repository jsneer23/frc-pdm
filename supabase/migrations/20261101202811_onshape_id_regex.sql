-- onshape id and occurrence path regex
alter table public.part_exports
  add constraint part_exports_document_id_format
    check (document_id ~ '^[0-9a-f]{24}$'),
  add constraint part_exports_workspace_id_format
    check (workspace_id ~ '^[0-9a-f]{24}$'),
  add constraint part_exports_element_id_format
    check (element_id ~ '^[0-9a-f]{24}$'),
  add constraint part_exports_microversion_id_format
    check (microversion_id ~ '^[0-9a-f]{24}$'),
  add constraint part_exports_selection_id_format
    check (selection_id ~ '^[!-~]{1,100}$'),
  add constraint part_exports_occurrence_path_format
    check (
      char_length(occurrence_path) <= 500
      and occurrence_path ~ '^[!-~]+$'
      and occurrence_path ~ '^[^.]+(\.[^.]+)*$'
    );