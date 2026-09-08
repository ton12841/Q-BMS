'use client';

import Link from 'next/link';
import {useCallback, useEffect, useMemo, useState} from 'react';
import QBMSAppShell, {QBMSIcon} from '@/components/layout/QBMSAppShell';
import {useI18n} from '@/i18n/useQBMSI18n';
import {
  fetchInvitationQueue,
  queueInvitation,
  revokeInvitation,
  type HRInvitationRow,
} from './invitation.api';
import styles from './HRInvitationPage.module.css';

function employeeName(row: HRInvitationRow) {
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return row.nickname ? `${full} (${row.nickname})` : full;
}

function statusKey(row: HRInvitationRow) {
  return row.invitation_status || 'DRAFT';
}

export default function HRInvitationPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<HRInvitationRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await fetchInvitationQueue(locale));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('hrInvitation.loadError'));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchInvitationQueue(locale, controller.signal)
      .then(setRows)
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
        setError(loadError instanceof Error ? loadError.message : t('hrInvitation.loadError'));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter((row) => [
      row.employee_code,
      row.first_name,
      row.last_name,
      row.nickname,
      row.company_email,
      row.business_unit_name,
      row.position_name,
    ].filter(Boolean).join(' ').toLowerCase().includes(value));
  }, [query, rows]);

  const metrics = useMemo(() => ({
    ready: rows.filter((row) => statusKey(row) === 'DRAFT').length,
    queued: rows.filter((row) => statusKey(row) === 'QUEUED').length,
    accepted: rows.filter((row) => statusKey(row) === 'ACCEPTED').length,
  }), [rows]);

  async function handleQueue(row: HRInvitationRow) {
    setBusyId(row.employee_id);
    setError('');
    setNotice('');
    try {
      await queueInvitation(row.employee_id, locale);
      setNotice(t('hrInvitation.queueSuccess', {email: row.company_email}));
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('hrInvitation.queueError'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(row: HRInvitationRow) {
    setBusyId(row.employee_id);
    setError('');
    setNotice('');
    try {
      await revokeInvitation(row.employee_id, locale);
      setNotice(t('hrInvitation.revokeSuccess'));
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('hrInvitation.revokeError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t('hrInvitation.pageTitle')}
      pageDescription={t('hrInvitation.pageDescription')}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t('hrInvitation.searchPlaceholder')}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t('shell.modulesTools')}</Link>
        <span>›</span>
        <Link href="/hrm">{t('hrm.pageTitle')}</Link>
        <span>›</span>
        <strong>{t('hrInvitation.pageTitle')}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t('hrInvitation.eyebrow')}</div>
          <h2>{t('hrInvitation.heroTitle')}</h2>
          <p>{t('hrInvitation.heroDescription')}</p>
        </div>
        <div className="qbms-master-header-actions">
          <button className={styles.refreshButton} type="button" onClick={loadData} disabled={loading}>
            <QBMSIcon name="refresh" size={16} />
            {t('common.refresh')}
          </button>
          <Link href="/hrm" className={styles.backButton}>
            <QBMSIcon name="arrowLeft" size={16} />
            {t('hrInvitation.backToHRM')}
          </Link>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t('hrInvitation.ready')}</span>
          <strong>{loading ? '—' : metrics.ready}</strong>
          <small>{t('hrInvitation.readyHint')}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t('hrInvitation.queued')}</span>
          <strong>{loading ? '—' : metrics.queued}</strong>
          <small>{t('hrInvitation.queuedHint')}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t('hrInvitation.accepted')}</span>
          <strong>{loading ? '—' : metrics.accepted}</strong>
          <small>{t('hrInvitation.acceptedHint')}</small>
        </div>
      </section>

      <section className={styles.deliveryNotice}>
        <span className={styles.noticeIcon}><QBMSIcon name="bell" size={18} /></span>
        <div>
          <strong>{t('hrInvitation.deliveryTitle')}</strong>
          <p>{t('hrInvitation.deliveryBody')}</p>
        </div>
      </section>

      {notice && <section className={styles.successNotice}>{notice}</section>}
      {error && <section className={styles.errorNotice}>{error}</section>}

      <section className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <div>
            <h3>{t('hrInvitation.queueTitle')}</h3>
            <p>{t('hrInvitation.queueDescription')}</p>
          </div>
          <span>{t('common.items', {count: filteredRows.length})}</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>{t('common.loading')}</div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.emptyState}>
            <QBMSIcon name="users" size={28} />
            <strong>{t('hrInvitation.emptyTitle')}</strong>
            <p>{t('hrInvitation.emptyBody')}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('hrInvitation.employee')}</th>
                  <th>{t('hrInvitation.organization')}</th>
                  <th>{t('hrInvitation.companyEmail')}</th>
                  <th>{t('hrInvitation.invitationStatus')}</th>
                  <th>{t('hrInvitation.expires')}</th>
                  <th>{t('hrInvitation.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const status = statusKey(row);
                  const active = ['DRAFT', 'QUEUED', 'SENT'].includes(status);
                  const canQueue = status === 'DRAFT';
                  const canRevoke = active && status !== 'DRAFT';
                  return (
                    <tr key={row.employee_id}>
                      <td>
                        <div className={styles.employeeCell}>
                          <strong>{employeeName(row)}</strong>
                          <span>{row.employee_code}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackCell}>
                          <strong>{row.business_unit_name || '—'}</strong>
                          <span>{row.position_name || '—'}{row.grade_number ? ` · G${row.grade_number}` : ''}</span>
                        </div>
                      </td>
                      <td><span className={styles.emailText}>{row.company_email}</span></td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${status}`] || ''}`}>
                          {t(`hrInvitation.status.${status}`)}
                        </span>
                      </td>
                      <td>{row.expires_at ? new Date(row.expires_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className={styles.actions}>
                          {canQueue ? (
                            <button type="button" className={styles.primaryAction} onClick={() => handleQueue(row)} disabled={busyId === row.employee_id}>
                              {busyId === row.employee_id ? t('hrInvitation.queuing') : t('hrInvitation.queueAction')}
                            </button>
                          ) : null}
                          {canRevoke ? (
                            <button type="button" className={styles.secondaryAction} onClick={() => handleRevoke(row)} disabled={busyId === row.employee_id}>
                              {t('hrInvitation.revokeAction')}
                            </button>
                          ) : null}
                          {!canQueue && !canRevoke ? <span className={styles.noAction}>—</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </QBMSAppShell>
  );
}
