'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import QBMSAppShell, {QBMSIcon, type QBMSIconName} from '@/components/layout/QBMSAppShell';
import {useI18n} from '@/i18n/useQBMSI18n';
import {fetchInvitationQueue, type HRInvitationRow} from '@/tools/hrm/invitation/invitation.api';
import styles from './HRMPage.module.css';

type WorkspaceCard = {
  titleKey: string;
  descriptionKey: string;
  icon: QBMSIconName;
  href?: string;
  status: 'available' | 'planned';
};

const workspaces: WorkspaceCard[] = [
  {
    titleKey: 'hrm.invitation.title',
    descriptionKey: 'hrm.invitation.description',
    icon: 'bell',
    href: '/hrm/invitations',
    status: 'available',
  },
  {
    titleKey: 'hrm.onboarding.title',
    descriptionKey: 'hrm.onboarding.description',
    icon: 'users',
    status: 'planned',
  },
  {
    titleKey: 'hrm.attendance.title',
    descriptionKey: 'hrm.attendance.description',
    icon: 'clock',
    status: 'planned',
  },
  {
    titleKey: 'hrm.performance.title',
    descriptionKey: 'hrm.performance.description',
    icon: 'chart',
    status: 'planned',
  },
];

export default function HRMPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<HRInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchInvitationQueue(locale, controller.signal)
      .then(setRows)
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
        setError(loadError instanceof Error ? loadError.message : t('hrm.loadError'));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const metrics = useMemo(() => {
    const ready = rows.filter((row) => !row.invitation_status || row.invitation_status === 'DRAFT').length;
    const queued = rows.filter((row) => row.invitation_status === 'QUEUED').length;
    const accepted = rows.filter((row) => row.invitation_status === 'ACCEPTED').length;
    return {ready, queued, accepted};
  }, [rows]);

  return (
    <QBMSAppShell pageTitle={t('hrm.pageTitle')} pageDescription={t('hrm.pageDescription')}>
      <div className="qbms-breadcrumb">
        <Link href="/">{t('shell.modulesTools')}</Link>
        <span>›</span>
        <strong>{t('hrm.pageTitle')}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t('hrm.eyebrow')}</div>
          <h2>{t('hrm.heroTitle')}</h2>
          <p>{t('hrm.heroDescription')}</p>
        </div>
        <div className="qbms-master-header-actions">
          <Link href="/" className={styles.backButton}>
            <QBMSIcon name="arrowLeft" size={16} />
            {t('hrm.backToModules')}
          </Link>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t('hrm.readyInvitation')}</span>
          <strong>{loading ? '—' : metrics.ready}</strong>
          <small>{t('hrm.readyInvitationHint')}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t('hrm.queuedInvitation')}</span>
          <strong>{loading ? '—' : metrics.queued}</strong>
          <small>{t('hrm.queuedInvitationHint')}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t('hrm.acceptedInvitation')}</span>
          <strong>{loading ? '—' : metrics.accepted}</strong>
          <small>{t('hrm.acceptedInvitationHint')}</small>
        </div>
      </section>

      {error && (
        <section className={styles.inlineError}>
          <strong>{t('hrm.loadError')}</strong>
          <span>{error}</span>
        </section>
      )}

      <section className={styles.workspaceSection}>
        <div className={styles.sectionHeading}>
          <div>
            <h3>{t('hrm.workspaceTitle')}</h3>
            <p>{t('hrm.workspaceDescription')}</p>
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          {workspaces.map((item) => {
            const body = (
              <>
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}><QBMSIcon name={item.icon} size={22} /></span>
                  <span className={`${styles.statusTag} ${item.status === 'available' ? styles.available : styles.planned}`}>
                    {t(`hrm.status.${item.status}`)}
                  </span>
                </div>
                <div className={styles.cardCopy}>
                  <strong>{t(item.titleKey)}</strong>
                  <p>{t(item.descriptionKey)}</p>
                </div>
                <div className={styles.cardFooter}>
                  {item.href ? (
                    <>
                      <span>{t('hrm.openWorkspace')}</span>
                      {!loading && metrics.ready > 0 ? <b>{metrics.ready}</b> : null}
                      <QBMSIcon name="chevron" size={17} />
                    </>
                  ) : (
                    <span>{t('hrm.plannedCapability')}</span>
                  )}
                </div>
              </>
            );

            return item.href ? (
              <Link href={item.href} className={styles.workspaceCard} key={item.titleKey}>{body}</Link>
            ) : (
              <div className={`${styles.workspaceCard} ${styles.disabledCard}`} key={item.titleKey}>{body}</div>
            );
          })}
        </div>
      </section>

      <section className={styles.flowPanel}>
        <div className={styles.flowHeading}>
          <span className={styles.flowIcon}><QBMSIcon name="users" size={19} /></span>
          <div>
            <strong>{t('hrm.flowTitle')}</strong>
            <p>{t('hrm.flowDescription')}</p>
          </div>
        </div>
        <div className={styles.flowSteps}>
          <span>{t('hrm.flow.hr')}</span><b>→</b>
          <span>{t('hrm.flow.it')}</span><b>→</b>
          <span>{t('hrm.flow.invite')}</span><b>→</b>
          <span>{t('hrm.flow.google')}</span><b>→</b>
          <span>{t('hrm.flow.profile')}</span>
        </div>
      </section>
    </QBMSAppShell>
  );
}
