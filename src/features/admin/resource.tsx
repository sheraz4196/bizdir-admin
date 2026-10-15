import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  RefreshCw,
  LoaderCircle,
  Eye
} from 'lucide-react';
import { models } from './models';
import { human, options } from './options';
import { readData } from './api';
type Row = Record<string, any>;
function display(value: any) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
export function ResourcePage({ resource }: { resource: string }) {
  const m = models.find((x) => x.name === resource);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [inspecting, setInspecting] = useState<Row | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const q = useQuery({
    queryKey: ['admin-records', resource, page, term, status],
    queryFn: () => readData({ data: { model: resource, page, search: term, status } }),
    enabled: !!m,
    retry: 1
  });
  if (!m)
    return (
      <div className='bd-content'>
        <h1>Resource not found</h1>
        <p>Choose a resource from the navigation.</p>
      </div>
    );
  const priority: Record<string, string[]> = {
    business: ['name', 'phone', 'city_id', 'status', 'verified', 'created_at'],
    location: ['name', 'level', 'parent_id', 'slug', 'is_active'],
    concept: ['name', 'type', 'slug', 'parent_id', 'is_active'],
    app_user: ['name', 'phone', 'email', 'role', 'is_active'],
    review: ['reviewer_name', 'business_id', 'rating', 'comment', 'status'],
    lead: ['customer_name', 'customer_phone', 'business_id', 'status', 'created_at']
  };
  const columns =
    priority[m.name] ||
    m.fields
      .filter((f) => !f.generated || f.name === 'id')
      .slice(0, 6)
      .map((f) => f.name);
  return (
    <div className='bd-content'>
      <div className='bd-page-heading'>
        <div>
          <span className='bd-eyebrow'>
            {m.readonly ? 'DIRECTORY INSIGHTS' : 'DIRECTORY MANAGEMENT'}
          </span>
          <h1>
            {m.label}
            <span className='bd-title-dot'>.</span>
          </h1>
          <p>{`Browse ${m.label.toLowerCase()} across your directory.`}</p>
        </div>
      </div>
      <div className='bd-card'>
        <div className='bd-resource-toolbar'>
          <div className='bd-search'>
            <Search size={17} />
            <input
              aria-label='Search records'
              placeholder={`Search ${m.label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className='bd-icon' aria-label='Clear search' onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className='bd-table-tools'>
            {options[`${m.name}.status`] && (
              <label className='bd-status-filter'>
                <SlidersHorizontal size={15} />
                <select
                  aria-label='Filter by status'
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value=''>All statuses</option>
                  {options[`${m.name}.status`].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <button className='bd-btn bd-small' onClick={() => q.refetch()} disabled={q.isFetching}>
              <RefreshCw size={14} className={q.isFetching ? 'bd-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        <div className='bd-list-caption'>
          <strong>{m.label}</strong>
          <span>{q.data?.total ?? '—'} records</span>
          {m.readonly && <span>Read only</span>}
        </div>
        {q.error ? (
          <div role='alert' className='bd-error'>
            Unable to load records. Check your connection or sign in again.{' '}
            <button onClick={() => q.refetch()}>Retry</button>
          </div>
        ) : (
          <div className='bd-table-wrap'>
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{human(c)}</th>
                  ))}
                  <th className='bd-action-cell'>{m.readonly ? 'Details' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.rows.map((r: Row) => (
                  <tr key={m.keys.map((k) => r[k]).join(':')}>
                    {columns.map((c, i) => (
                      <td key={c}>
                        {c === 'status' ? (
                          <span className={`bd-pill ${r[c]}`}>{r[c]}</span>
                        ) : c === 'is_active' || c === 'verified' ? (
                          <span className={`bd-pill ${r[c] ? 'active' : 'muted'}`}>
                            {r[c] ? 'Yes' : 'No'}
                          </span>
                        ) : c === 'created_at' ? (
                          new Date(r[c]).toLocaleDateString()
                        ) : i === 0 ? (
                          <strong>{display(r[c])}</strong>
                        ) : (
                          <span title={display(r[c])} className='bd-truncate'>
                            {display(r[c])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className='bd-action-cell'>
                      {m.readonly && (
                        <button
                          className='bd-icon'
                          aria-label='View record details'
                          onClick={() => setInspecting(r)}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {q.isPending ? (
              <div className='bd-empty'>
                <LoaderCircle className='bd-spin' />
                <p>Loading records…</p>
              </div>
            ) : (
              !q.data?.rows.length && (
                <div className='bd-empty'>
                  <Building2 size={32} />
                  <h3>{term || status ? 'No matching records' : 'A fresh start'}</h3>
                  <p>
                    {term || status
                      ? 'Try another search or clear your filters.'
                      : 'No records to display yet.'}
                  </p>
                </div>
              )
            )}
          </div>
        )}
        <div className='bd-pagination'>
          <span>
            {q.data?.total
              ? `${page * 20 + 1}–${Math.min((page + 1) * 20, q.data.total)} of ${q.data.total}`
              : '0 records'}
          </span>
          <div>
            <button
              className='bd-btn bd-small'
              disabled={page === 0 || q.isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              className='bd-btn bd-small'
              disabled={!q.data || (page + 1) * 20 >= q.data.total || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      {inspecting && (
        <div className='bd-modal-backdrop'>
          <section
            className='bd-editor'
            role='dialog'
            aria-modal='true'
            aria-labelledby='details-title'
          >
            <div className='bd-editor-heading'>
              <h2 id='details-title'>Record details</h2>
              <button
                className='bd-icon'
                aria-label='Close details'
                onClick={() => setInspecting(null)}
              >
                <X />
              </button>
            </div>
            <div className='bd-editor-body'>
              <dl className='bd-details'>
                {Object.entries(inspecting).map(([key, value]) => (
                  <div key={key}>
                    <dt>{human(key)}</dt>
                    <dd>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : display(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
