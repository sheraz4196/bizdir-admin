import { database, Prisma } from './db';
import { requireAdmin } from './auth';
import { models, type Model } from '@/features/admin/models';
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
