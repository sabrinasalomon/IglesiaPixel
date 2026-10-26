-- Datos de ejemplo de la Fase 3 (opcional): aportaciones de los últimos 6
-- meses. Cada domingo hay varios diezmos y ofrendas, y entre semana algún
-- donativo ocasional. Requiere los datos de ejemplo de la Fase 1 (seed.sql).

with dias as (
  select d::date as fecha
  from generate_series(current_date - 180, current_date, interval '1 day') as d
),
cuantas as (
  -- Domingos: entre 6 y 11 aportaciones por sede; entre semana, 15% de probabilidad de una
  select s.id as sede_id, dias.fecha,
         case when extract(dow from dias.fecha) = 0 then 6 + floor(random() * 6)::int
              when random() < 0.15 then 1 else 0 end as n
  from public.sedes s cross join dias
),
aportes as (
  select c.sede_id, c.fecha, random() as r1, random() as r2, random() as r3
  from cuantas c cross join lateral generate_series(1, c.n)
),
con_concepto as (
  select a.*,
         case when r1 < 0.45 then 'Diezmo'
              when r1 < 0.75 then 'Ofrenda'
              else (array['Primicias', 'Donativo especial', 'Misiones', 'Construcción', 'Otro'])[1 + floor(r2 * 5)::int]
         end as concepto
  from aportes a
)
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo, miembro_id)
select c.sede_id, c.fecha,
       round(case when c.concepto = 'Diezmo' then 800 + r2 * 2200 else 100 + r2 * 900 end / 10) * 10,
       c.concepto,
       case when c.concepto = 'Ofrenda' and r3 < 0.6 then 'Efectivo'
            else (array['Efectivo', 'Transferencia SPEI', 'Tarjeta', 'Depósito bancario', 'Cheque'])[1 + floor(r3 * 5)::int]
       end,
       -- Las ofrendas suelen ser anónimas; el resto se asocia a un miembro activo de la sede
       case when c.concepto = 'Ofrenda' and r3 < 0.6 then null
            else (select m.id from public.miembros m
                  where m.sede_id = c.sede_id and m.activo
                  order by md5(m.id::text || c.r1::text) limit 1)
       end
from con_concepto c;
