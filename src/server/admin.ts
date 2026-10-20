import { database, Prisma } from './db';
import { requireAdmin, checkOrigin } from './auth';
import { models, type Model, type Field } from '@/features/admin/models';
import { options } from '@/features/admin/options';
type Row = Record<string, any>;
const json = <T>(value: T): any =>
  JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
function model(name: string) {
  const m = models.find((x) => x.name === name);
  if (!m) throw new Error('Unknown resource.');
  return m;
}
function delegate(name: string, db: any = database()): any {
  model(name);
  return db[name];
}
function filter(m: Model, search: string, status: string) {
  const terms = m.fields
    .filter((f) => f.type === 'String' && !f.name.endsWith('_id'))
    .map((f) => ({ [f.name]: { contains: search, mode: 'insensitive' } }));
  if (/^\d+$/.test(search)) {
    for (const f of m.fields.filter((f) => f.type === 'Int' || f.type === 'BigInt')) {
      if (f.type === 'BigInt') terms.push({ [f.name]: BigInt(search) } as any);
      else if (Number(search) <= 2147483647) terms.push({ [f.name]: Number(search) } as any);
    }
  }
  return {
    ...(search && terms.length ? { OR: terms } : {}),
    ...(status && m.fields.some((f) => f.name === 'status') ? { status } : {})
  };
}
function order(m: Model) {
  return [
    ...(m.fields.some((f) => f.name === 'created_at') ? [{ created_at: 'desc' }] : []),
    ...m.keys.map((k) => ({ [k]: 'desc' }))
  ];
}
export async function read(input: { model: string; page: number; search: string; status: string }) {
  requireAdmin();
  const m = model(input.model);
  const where = filter(m, input.search, input.status);
  const [rows, total] = await Promise.all([
    delegate(m.name).findMany({ where, orderBy: order(m), skip: input.page * 20, take: 20 }),
    delegate(m.name).count({ where })
  ]);
  if ((m.name === 'business' || m.name === 'location') && rows.length) {
    const coords: any[] = await database().$queryRaw(
      Prisma.sql`SELECT id, ST_Y(geom::geometry) AS latitude, ST_X(geom::geometry) AS longitude FROM ${Prisma.raw(m.name)} WHERE id IN (${Prisma.join(rows.map((r: Row) => r.id))})`
    );
    const primary =
      m.name === 'business'
        ? await database().business_concept.findMany({
            where: { business_id: { in: rows.map((r: Row) => r.id) }, is_primary: true }
          })
        : [];
    for (const row of rows)
      row.primary_concept_id = primary.find((c) => c.business_id === row.id)?.concept_id ?? '';
    for (const row of rows)
      Object.assign(
        row,
        coords.find((c) => c.id === row.id)
      );
  }
  return json({ rows, total });
}
export async function getLookup(input: {
  model: string;
  search: string;
  id?: string;
  field?: string;
}) {
  requireAdmin();
  const m = model(input.model);
  if (!m.fields.some((f) => f.name === 'id')) return [];
  const label = [
    'name',
    'display_name',
    'customer_name',
    'reviewer_name',
    'raw_query',
    'code'
  ].find((k) => m.fields.some((f) => f.name === k));
  const where: Row = filter(m, input.search, '');
  if (input.id)
    where.OR = [
      ...(where.OR || []),
      { id: convert(m.fields.find((f) => f.name === 'id')!, input.id) }
    ];
  if (input.field === 'primary_concept_id') where.type = 'category';
  if (input.field === 'city_id') where.level = 'city';
  if (input.field === 'locality_id') where.level = 'locality';
  return json(
    (
      await delegate(m.name).findMany({
        where,
        take: 50,
        orderBy: label ? { [label]: 'asc' } : { id: 'desc' }
      })
    ).map((r: Row) => ({
      id: r.id,
      label: label ? `${r[label]} · #${r.id}` : `#${r.id}`,
      parent_id: r.parent_id,
      level: r.level
    }))
  );
}
function convert(f: Field, v: any): any {
  if (v === null || v === '' || v === undefined) {
    if (f.required) throw new Error(`${f.name.replaceAll('_', ' ')} is required.`);
    return null;
  }
  if (f.type === 'Boolean') {
    if (typeof v !== 'boolean') throw new Error(`Invalid ${f.name}.`);
    return v;
  }
  if (f.type === 'BigInt') {
    if (!/^\d+$/.test(String(v))) throw new Error(`Invalid ${f.name}.`);
    return BigInt(v);
  }
  if (f.type === 'Int' || f.type === 'Decimal') {
    const n = Number(v);
    if (!Number.isFinite(n) || (f.type === 'Int' && !Number.isInteger(n)))
      throw new Error(`Invalid ${f.name}.`);
    return n;
  }
  if (f.type === 'DateTime') {
    const d = new Date(
      f.timeOnly && !String(v).includes('T') ? `1970-01-01T${v.length === 5 ? v + ':00' : v}Z` : v
    );
    if (isNaN(d.getTime())) throw new Error(`Invalid ${f.name}.`);
    return d;
  }
  if (f.type === 'Json') return typeof v === 'string' ? JSON.parse(v) : v;
  if (typeof v !== 'string') throw new Error(`Invalid ${f.name}.`);
  const text = v.trim();
  if (f.required && !text) throw new Error(`${f.name} is required.`);
  return text;
}
function key(m: Model, row: Row) {
  const k = Object.fromEntries(
    m.keys.map((n) => [n, convert(m.fields.find((f) => f.name === n)!, row[n])])
  );
  return m.keys.length === 1 ? k : { [m.keys.join('_')]: k };
}
function clean(m: Model, values: Row, editing: boolean) {
  const out: Row = {};
  for (const f of m.fields) {
    if (f.generated || (editing && m.keys.includes(f.name))) continue;
    if (values[f.name] === undefined) {
      if (!editing && f.required && f.default === undefined)
        throw new Error(`${f.name} is required.`);
      continue;
    }
    let v = convert(f, values[f.name]);
    if (
      f.name === 'text' &&
      ['concept_alias', 'location_alias'].includes(m.name) &&
      typeof v === 'string'
    )
      v = v.toLowerCase().replace(/\s+/g, ' ').trim();
    if (
      f.name === 'slug' &&
      typeof v === 'string' &&
      !(
        m.name === 'concept' || m.name === 'attribute'
          ? /^[a-z0-9]+(_[a-z0-9]+)*$/
          : /^[a-z0-9]+(-[a-z0-9]+)*$/
      ).test(v)
    )
      throw new Error(
        'Use a lowercase slug with numbers and ' +
          (m.name === 'concept' || m.name === 'attribute' ? 'underscores.' : 'hyphens.')
      );
    if (
      v !== null &&
      ['phone', 'customer_phone', 'whatsapp'].includes(f.name) &&
      !/^\+91[6-9][0-9]{9}$/.test(v)
    )
      throw new Error(
        'Phone numbers must use +91 followed by a valid 10-digit Indian mobile number.'
      );
    const ranges: Record<string, [number, number]> = {
      weekday: [0, 6],
      price_level: [1, 3],
      year_established: [1800, 2100],
      rating: [1, 5],
      trust: [0, 1],
      commission_pct: [0, 100],
      guests: [1, 32767]
    };
    if (
      v !== null &&
      ranges[f.name] &&
      (Number(v) < ranges[f.name][0] || Number(v) > ranges[f.name][1])
    )
      throw new Error(
        `${f.name.replaceAll('_', ' ')} must be between ${ranges[f.name].join(' and ')}.`
      );
    if (
      v !== null &&
      ['amount', 'amount_paid', 'flat_fee_inr', 'booking_value', 'commission_amount'].includes(
        f.name
      ) &&
      Number(v) < 0
    )
      throw new Error('Amounts cannot be negative.');
    const choices = options[`${m.name}.${f.name}`];
    if (choices && !choices.includes(v)) throw new Error(`Invalid ${f.name}.`);
    out[f.name] = v;
  }
  if (out.open_time && out.close_time && out.close_time <= out.open_time)
    throw new Error('Closing time must be after opening time.');
  if (out.starts_on && out.ends_on && out.ends_on < out.starts_on)
    throw new Error('The subscription end date must be on or after the start date.');
  if (out.period_month && out.period_month.getUTCDate() !== 1)
    throw new Error('Choose the first day of the payout month.');
  if (m.fields.some((f) => f.name === 'updated_at')) out.updated_at = new Date();
  return out;
}
function friendly(error: any): never {
  if (error.code === 'P2002') throw new Error('A record with these unique values already exists.');
  if (error.code === 'P2003')
    throw new Error(
      'This record references another record, or is still in use. Check linked records first.'
    );
  if (error.code === 'P2025')
    throw new Error('This record no longer exists. Refresh and try again.');
  if (error.code)
    throw new Error('The database rejected this change. Check the values and related records.');
  throw error;
}
async function rating(tx: any, businessId: bigint) {
  const aggregate = await tx.review.aggregate({
    where: { business_id: businessId, status: 'approved' },
    _avg: { rating: true },
    _count: { id: true }
  });
  await tx.business.update({
    where: { id: businessId },
    data: {
      rating: aggregate._avg.rating || 0,
      review_count: aggregate._count.id,
      updated_at: new Date()
    }
  });
}
export async function save(input: { model: string; values: Row; original?: Row }) {
  requireAdmin();
  checkOrigin();
  const m = model(input.model);
  if (m.readonly) throw new Error('Activity logs are read only.');
  const values = clean(m, input.values, !!input.original);
  try {
    return await database().$transaction(async (tx) => {
      let row: Row;
      if (m.name === 'business') {
        const lat = Number(input.values.latitude),
          lng = Number(input.values.longitude);
        if (
          input.values.latitude === '' ||
          input.values.longitude === '' ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        )
          throw new Error('Enter valid latitude and longitude.');
        const city = await tx.location.findUnique({
          where: { id: values.city_id ?? Number(input.original?.city_id) }
        });
        if (city?.level !== 'city') throw new Error('Choose a city location.');
        if (values.locality_id) {
          const loc = await tx.location.findUnique({ where: { id: values.locality_id } });
          if (loc?.level !== 'locality' || loc.parent_id !== city.id)
            throw new Error('Choose a locality belonging to the selected city.');
        }
        if (input.original) {
          row = await tx.business.update({ where: key(m, input.original) as any, data: values });
        } else {
          const columns = Object.keys(values);
          const result: any[] = await tx.$queryRaw(
            Prisma.sql`INSERT INTO business (${Prisma.join(columns.map((c) => Prisma.raw('"' + c + '"')))}, geom) VALUES (${Prisma.join(Object.values(values))}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326)::geography) RETURNING id`
          );
          row = result[0];
        }
        if (input.values.primary_concept_id) {
          const categoryId = Number(input.values.primary_concept_id);
          const category = await tx.concept.findUnique({ where: { id: categoryId } });
          if (category?.type !== 'category')
            throw new Error('Choose a category as the primary category.');
          await tx.business_concept.updateMany({
            where: { business_id: row.id, is_primary: true },
            data: { is_primary: false }
          });
          await tx.business_concept.upsert({
            where: { business_id_concept_id: { business_id: row.id, concept_id: categoryId } },
            update: { is_primary: true },
            create: { business_id: row.id, concept_id: categoryId, is_primary: true }
          });
        } else if (!input.original) throw new Error('Choose a primary category for this place.');
        await tx.$executeRaw(
          Prisma.sql`UPDATE business SET geom=ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326)::geography WHERE id=${row.id}`
        );
      } else {
        if (m.name === 'location' || m.name === 'concept') {
          const parent = values.parent_id;
          if (parent && input.original) {
            let id: number | null = parent;
            const seen = new Set<number>([Number(input.original.id)]);
            while (id) {
              if (seen.has(id))
                throw new Error('A parent cannot be this record or one of its descendants.');
              seen.add(id);
              const ancestor = await delegate(m.name, tx).findUnique({
                where: { id },
                select: { parent_id: true }
              });
              id = ancestor?.parent_id ?? null;
            }
          }
        }
        row = input.original
          ? await delegate(m.name, tx).update({ where: key(m, input.original), data: values })
          : await delegate(m.name, tx).create({ data: values });
      }
      if (
        m.name === 'location' &&
        (input.values.latitude !== undefined || input.values.longitude !== undefined)
      ) {
        const hasLat =
          input.values.latitude !== '' &&
          input.values.latitude !== null &&
          input.values.latitude !== undefined;
        const hasLng =
          input.values.longitude !== '' &&
          input.values.longitude !== null &&
          input.values.longitude !== undefined;
        if (hasLat !== hasLng) throw new Error('Provide both latitude and longitude.');
        if (hasLat) {
          const lat = Number(input.values.latitude),
            lng = Number(input.values.longitude);
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          )
            throw new Error('Enter valid coordinates.');
          await tx.$executeRaw(
            Prisma.sql`UPDATE location SET geom=ST_SetSRID(ST_MakePoint(${lng},${lat}),4326)::geography WHERE id=${row.id}`
          );
        } else if (values.geom_verified)
          throw new Error('Add coordinates before marking geometry verified.');
        else await tx.$executeRaw(Prisma.sql`UPDATE location SET geom=NULL WHERE id=${row.id}`);
      }
      if (m.name === 'review') {
        await rating(tx, row.business_id);
        if (input.original && String(row.business_id) !== String(input.original.business_id))
          await rating(tx, BigInt(input.original.business_id));
      }
      return { ok: true };
    });
  } catch (e) {
    friendly(e);
  }
}
export async function remove(input: { model: string; original: Row }) {
  requireAdmin();
  checkOrigin();
  const m = model(input.model);
  if (m.readonly) throw new Error('Activity logs are read only.');
  try {
    await database().$transaction(async (tx) => {
      await delegate(m.name, tx).delete({ where: key(m, input.original) });
      if (m.name === 'review') await rating(tx, BigInt(input.original.business_id));
    });
    return { ok: true };
  } catch (e) {
    friendly(e);
  }
}
export async function dashboard() {
  requireAdmin();
  const db = database();
  const [
    places,
    locations,
    categories,
    leads,
    pendingPlaces,
    pendingReviews,
    active,
    recent,
    searches,
    clicks,
    statuses,
    topCities
  ] = await Promise.all([
    db.business.count(),
    db.location.count(),
    db.concept.count(),
    db.lead.count(),
    db.business.count({ where: { status: 'pending' } }),
    db.review.count({ where: { status: 'pending' } }),
    db.business.count({ where: { status: 'active' } }),
    db.business.findMany({ orderBy: { created_at: 'desc' }, take: 6 }),
    db.search_log.count(),
    db.click_log.count(),
    db.business.groupBy({ by: ['status'], _count: { id: true } }),
    db.business.groupBy({
      by: ['city_id'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })
  ]);
  const cities = await db.location.findMany({
    where: { id: { in: topCities.map((c) => c.city_id) } }
  });
  return json({
    places,
    locations,
    categories,
    leads,
    pendingPlaces,
    pendingReviews,
    active,
    recent,
    searches,
    clicks,
    statuses,
    topCities: topCities.map((c) => ({
      name: cities.find((l) => l.id === c.city_id)?.name || String(c.city_id),
      count: c._count.id
    }))
  });
}
