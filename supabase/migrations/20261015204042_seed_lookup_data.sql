insert into materials (code, label) values
  ('srpp',             'SRPP'),
  ('polycarbonate',    'Polycarbonate'),
  ('wood',             'Plywood'),
  ('al6061',           'Aluminum 6061'),
  ('al7075',           'Aluminum 7075'),
  ('al5052',           'Aluminum 5052'),
  ('tpu',              'TPU (95A)'),
  ('petg',             'PETG'),
  ('pla',              'PLA+'),
  ('nylon',            'NYLON'),
  ('onyx',             'Onyx (Markforged Only)'),
  ('tube_2x1_7075',    '2x1 7075 (black)'),
  ('tube_2x1_punched', '2x1 Punched'),
  ('tube_2x1_blank',   '2x1 Blank'),
  ('tube_1x1_punched', '1x1 Punched'),
  ('tube_1x1_blank',   '1x1 Blank'),
  ('maxtube_2x1',      '2x1 Maxtube'),
  ('maxtube_1x1',      '1x1 Maxtube'),
  ('alu_maxspline',    'Maxspline'),
  ('poly_maxspline',   'Polycarbonate Maxspline'),
  ('hex_0500_159',     '1/2" Hex (WCP)');

insert into stocks (material_id, thickness_in)
select m.id, v.thickness_in
from (values
  ('srpp',             0.25),
  ('polycarbonate',    0.118),
  ('polycarbonate',    0.196),
  ('polycarbonate',    0.236),
  ('al6061',           0.125),
  ('al6061',           0.1875),
  ('al6061',           0.25),
  ('tube_2x1_7075',    0.0625),
  ('tube_2x1_punched', 0.0625),
  ('tube_2x1_punched', 0.09375),
  ('tube_2x1_punched', 0.125),
  ('tube_2x1_blank',   0.0625),
  ('tube_2x1_blank',   0.125),
  ('tube_1x1_punched', 0.0625),
  ('tube_1x1_punched', 0.125),
  ('tube_1x1_blank',   0.0625),
  ('tube_1x1_blank',   0.125),
  ('maxtube_2x1',      0.04),
  ('maxtube_2x1',      0.125),
  ('maxtube_1x1',      0.04),
  ('maxtube_1x1',      0.125),
  ('tpu',              null),
  ('petg',             null),
  ('pla',              null),
  ('nylon',            null),
  ('onyx',             null),
  ('alu_maxspline',    null),
  ('poly_maxspline',   null),
  ('hex_0500_159',     null)
) as v (code, thickness_in)
join materials m on m.code = v.code;

insert into machines (code, label, file_format, selection) values
  ('saw',       'Chop Saw',   'dwg',  null),
  ('co2_laser', 'CO2 Laser',  'dxf',  'face'),
  ('router',    'Router',     'step', 'body'),
  ('printer',   '3D Printer', 'step', 'body'),
  ('lathe',     'Lathe',      'dwg',  null);

insert into machine_materials (machine_id, material_id)
select ma.id, mt.id
from (values
  ('saw',       'tube_2x1_7075'),
  ('saw',       'tube_2x1_punched'),
  ('saw',       'tube_2x1_blank'),
  ('saw',       'tube_1x1_punched'),
  ('saw',       'tube_1x1_blank'),
  ('saw',       'maxtube_2x1'),
  ('saw',       'maxtube_1x1'),
  ('saw',       'alu_maxspline'),
  ('saw',       'poly_maxspline'),
  ('co2_laser', 'srpp'),
  ('co2_laser', 'polycarbonate'),
  ('co2_laser', 'wood'),
  ('router',    'srpp'),
  ('router',    'polycarbonate'),
  ('router',    'wood'),
  ('router',    'al6061'),
  ('router',    'al7075'),
  ('router',    'al5052'),
  ('printer',   'tpu'),
  ('printer',   'petg'),
  ('printer',   'pla'),
  ('printer',   'nylon'),
  ('printer',   'onyx'),
  ('lathe',     'hex_0500_159')
) as v (machine_code, material_code)
join machines ma on ma.code = v.machine_code
join materials mt on mt.code = v.material_code;