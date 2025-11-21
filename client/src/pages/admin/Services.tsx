import { useTranslation } from 'react-i18next';

export default function Services() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-5xl p-2">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t('page.adminServices.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.adminServices.subtitle')}</p>
      </header>
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        {t('page.adminServices.comingSoon')}
      </div>
    </section>
  );
}
