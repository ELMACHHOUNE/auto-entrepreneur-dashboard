import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { MagicCard } from '@/components/ui/magic-card';
import AlertBanner from '@/components/ui/alert-banner';
import { FileUploader, FileInput, type DropzoneOptions } from '@/components/ui/file-upload';
import AuthSplit from '@/components/layout/AuthSplit';
import guideData from '@/assets/data.json';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  IdCard,
  Briefcase,
  Chrome,
  UserPlus,
  Eye,
  EyeOff,
  CloudUpload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ApiError = { response?: { data?: { error?: string } } };

export default function Register() {
  const { register, updateAvatar } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    ICE: '',
    service: '',
    // structured service fields
    profileKind: '' as '' | 'guide_auto_entrepreneur' | 'company_guide',
    serviceCategory: '',
    serviceType: '',
    serviceActivity: '',
    companyTypeCode: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // placeholder only, not uploaded
  const [err, setErr] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const googleUrl = `${import.meta.env.VITE_API_URL}api/auth/google`;

  const errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {};
    if (!form.fullName || form.fullName.trim().length < 2)
      e.fullName = t('auth.register.errors.fullNameRequired');
    // Phone: allow +, spaces, parentheses, dashes; must contain 9-15 digits total
    const digits = form.phone.replace(/\D/g, '');
    if (!digits || digits.length < 9 || digits.length > 15)
      e.phone = t('auth.register.errors.phoneInvalid');
    // ICE: 15 digits
    const iceDigits = form.ICE.replace(/\D/g, '');
    if (iceDigits.length !== 15) e.ICE = t('auth.register.errors.iceInvalid');
    // New selection flow validation
    if (!form.profileKind) e.profileKind = t('auth.register.errors.profileTypeRequired');
    if (form.profileKind === 'guide_auto_entrepreneur') {
      if (!form.serviceCategory) e.serviceCategory = t('auth.register.errors.categoryRequired');
      if (!form.serviceType) e.serviceType = t('auth.register.errors.typeRequired');
      if (!form.serviceActivity) e.serviceActivity = t('auth.register.errors.activityRequired');
    } else if (form.profileKind === 'company_guide') {
      if (!form.companyTypeCode)
        e.companyTypeCode = t('auth.register.errors.companyTypeCodeRequired');
    }
    if (!form.email) e.email = t('auth.register.errors.emailRequired');
    if (!form.password || form.password.length < 6)
      e.password = t('auth.register.errors.passwordTooShort');
    return e;
  }, [form, t]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Avatar selection handled by FileUploader dropzone

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isValid) {
      setErr(t('auth.register.errors.fixAndRetry'));
      return;
    }
    try {
      // Derive service string based on selection
      let derivedService = form.service;
      if (form.profileKind === 'guide_auto_entrepreneur') {
        derivedService = form.serviceActivity || '';
      } else if (form.profileKind === 'company_guide') {
        derivedService = form.companyTypeCode || '';
      }

      const { email, password, fullName, phone, ICE } = form;
      await register({
        email,
        password,
        fullName,
        phone,
        ICE,
        service: derivedService,
        profileKind: form.profileKind || undefined,
        serviceCategory: form.serviceCategory || undefined,
        serviceType: form.serviceType || undefined,
        serviceActivity: form.serviceActivity || undefined,
        companyTypeCode: form.companyTypeCode || undefined,
      });
      // If user selected an avatar, upload it immediately after register (cookie already set)
      if (avatarFile) {
        try {
          await updateAvatar(avatarFile);
        } catch {
          // Surface avatar upload failure but keep the user on the page to retry
          setErr(t('auth.register.errors.avatarUploadFailed'));
          return;
        }
      }
      nav('/dashboard', { replace: true });
    } catch (e: unknown) {
      const apiErr = e as ApiError;
      setErr(apiErr.response?.data?.error || t('auth.register.errors.failedGeneric'));
    }
  };

  return (
    <AuthSplit rightClassName="flex h-full w-full items-stretch p-4 sm:p-6 md:p-8 text-foreground">
      <MagicCard gradientColor={isDark ? '#262626' : '#D9D9D955'} className="h-full w-full p-0">
        <div className="flex h-full flex-col">
          <div className="border-border border-b p-4 [.border-b]:pb-4">
            <h3 className="text-lg font-semibold">{t('auth.register.title')}</h3>
            <p className="text-sm ">{t('auth.register.subtitle')}</p>
          </div>
          <div className="flex-1 p-4">
            <form id="register-form" onSubmit={onSubmit} className="space-y-3">
              {/* Avatar section: mirror Profile page UX */}
              <div className="rounded-md bg-card/50 p-4">
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5 sm:gap-6">
                  {/* Left: label + helper text */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium">
                      {t('auth.register.profilePicture')}
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('auth.register.profilePictureHelp')}
                    </p>
                  </div>

                  {/* Center: avatar preview */}
                  <div className="sm:col-span-1 flex flex-col items-center gap-2">
                    <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-full border bg-background">
                      {avatarFile ? (
                        <img
                          src={URL.createObjectURL(avatarFile)}
                          alt="avatar preview"
                          className="h-full w-full object-cover"
                          width={96}
                          height={96}
                          decoding="async"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t('auth.register.noAvatar')}
                        </span>
                      )}
                    </div>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        {t('auth.register.clearSelection')}
                      </button>
                    )}
                  </div>

                  {/* Right: drag & drop uploader */}
                  <div className="sm:col-span-2 sm:justify-self-end w-full sm:max-w-60">
                    <FileUploader
                      value={avatarFile ? [avatarFile] : []}
                      onValueChange={files => setAvatarFile(files?.[0] ?? null)}
                      dropzoneOptions={
                        {
                          accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
                          multiple: false,
                          maxFiles: 1,
                          maxSize: 2 * 1024 * 1024,
                        } as DropzoneOptions
                      }
                      className="w-full"
                    >
                      <FileInput
                        aria-label={t('auth.register.profilePicture')}
                        className="rounded-md border border-dashed border-muted bg-background/60 outline-none transition hover:bg-muted/30"
                      >
                        <div className="flex w-full flex-col items-center justify-center px-3 py-3 text-center text-foreground">
                          <CloudUpload
                            className="mb-1 h-6 w-6 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <p className="mb-1 text-xs">
                            <span className="font-semibold">{t('auth.register.uploadCta')}</span>
                            &nbsp; {t('auth.register.uploadOrDrag')}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {t('auth.register.uploadTypes')}
                          </p>
                        </div>
                      </FileInput>
                    </FileUploader>
                  </div>
                </div>
              </div>

              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder={t('auth.register.fullNamePlaceholder')}
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder={t('auth.register.emailPlaceholder')}
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 pr-10 rounded"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')
                  }
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}

              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder={t('auth.register.phonePlaceholder')}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

              <div className="relative">
                <IdCard
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder={t('auth.register.icePlaceholder')}
                  value={form.ICE}
                  onChange={e => setForm({ ...form, ICE: e.target.value })}
                />
              </div>
              {errors.ICE && <p className="text-red-600 text-sm">{errors.ICE}</p>}
              {/* Profile kind selector */}
              <div className="relative">
                <Briefcase
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  className="w-full border p-2 pl-9 rounded bg-background text-foreground"
                  value={form.profileKind}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      profileKind: e.target.value as
                        | ''
                        | 'guide_auto_entrepreneur'
                        | 'company_guide',
                      // reset dependent fields when kind changes
                      serviceCategory: '',
                      serviceType: '',
                      serviceActivity: '',
                      companyTypeCode: '',
                    }))
                  }
                >
                  <option value="">{t('auth.register.selectProfileType')}</option>
                  <option value="guide_auto_entrepreneur">
                    {t('auth.register.profileTypes.guide')}
                  </option>
                  <option value="company_guide">{t('auth.register.profileTypes.company')}</option>
                </select>
              </div>
              {errors.profileKind && <p className="text-red-600 text-sm">{errors.profileKind}</p>}

              {/* Conditional selects */}
              {form.profileKind === 'guide_auto_entrepreneur' && (
                <>
                  {/* Category */}
                  <div className="relative">
                    <select
                      className="w-full border p-2 rounded bg-background text-foreground"
                      value={form.serviceCategory}
                      onChange={e => {
                        const nextCat = e.target.value;
                        // Find the section for category to derive type
                        const section = guideData.guide_auto_entrepreneur.sections.find(
                          s => s.category === nextCat
                        );
                        setForm(f => ({
                          ...f,
                          serviceCategory: nextCat,
                          serviceType: section?.type || '',
                          serviceActivity: '', // reset activity when category changes
                        }));
                      }}
                    >
                      <option value="">{t('auth.register.selectCategory')}</option>
                      {guideData.guide_auto_entrepreneur.sections.map(sec => (
                        <option key={sec.category} value={sec.category}>
                          {sec.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.serviceCategory && (
                    <p className="text-red-600 text-sm">{errors.serviceCategory}</p>
                  )}
                  {/* Type (derived from category; still selectable if needed) */}
                  <div className="relative">
                    <select
                      className="w-full border p-2 rounded bg-background text-foreground"
                      value={form.serviceType}
                      onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                    >
                      <option value="">{t('auth.register.selectType')}</option>
                      {/* Only one type per category in the data; offer whatever is on the section */}
                      {form.serviceCategory &&
                        (() => {
                          const section = guideData.guide_auto_entrepreneur.sections.find(
                            s => s.category === form.serviceCategory
                          );
                          return section ? (
                            <option value={section.type}>{section.type}</option>
                          ) : null;
                        })()}
                    </select>
                  </div>
                  {errors.serviceType && (
                    <p className="text-red-600 text-sm">{errors.serviceType}</p>
                  )}
                  {/* Activity */}
                  <div className="relative">
                    <select
                      className="w-full border p-2 rounded bg-background text-foreground"
                      value={form.serviceActivity}
                      onChange={e => setForm(f => ({ ...f, serviceActivity: e.target.value }))}
                      disabled={!form.serviceCategory}
                    >
                      <option value="">{t('auth.register.selectActivity')}</option>
                      {form.serviceCategory &&
                        guideData.guide_auto_entrepreneur.sections
                          .find(s => s.category === form.serviceCategory)
                          ?.activities.map(act => (
                            <option key={act} value={act}>
                              {act}
                            </option>
                          ))}
                    </select>
                  </div>
                  {errors.serviceActivity && (
                    <p className="text-red-600 text-sm">{errors.serviceActivity}</p>
                  )}
                </>
              )}
              {form.profileKind === 'company_guide' && (
                <div className="relative">
                  <select
                    className="w-full border p-2 rounded bg-background text-foreground"
                    value={form.companyTypeCode}
                    onChange={e => setForm(f => ({ ...f, companyTypeCode: e.target.value }))}
                  >
                    <option value="">{t('auth.register.selectCompanyTypeCode')}</option>
                    {guideData.company_guide.types.map(ti => (
                      <option key={ti.code} value={ti.code}>
                        {ti.code}
                      </option>
                    ))}
                  </select>
                  {errors.companyTypeCode && (
                    <p className="text-red-600 text-sm">{errors.companyTypeCode}</p>
                  )}
                </div>
              )}
              <AlertBanner
                open={Boolean(err)}
                variant="error"
                title={t('auth.register.errors.failedTitle')}
                description={err || t('auth.register.errors.failedGeneric')}
                onClose={() => setErr(null)}
              />
            </form>
          </div>
          <div className="border-border border-t p-4 [.border-t]:pt-4">
            <div className="flex flex-col gap-3">
              <InteractiveHoverButton
                className="w-full"
                form="register-form"
                type="submit"
                disabled={!isValid}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={16} />
                  {t('auth.register.submit')}
                </span>
              </InteractiveHoverButton>
              <InteractiveHoverButton
                type="button"
                onClick={() => (window.location.href = googleUrl)}
              >
                <span className="inline-flex items-center gap-2">
                  <Chrome size={16} />
                  {t('auth.register.google')}
                </span>
              </InteractiveHoverButton>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {t('auth.register.haveAccount')}
              <Link className="text-primary underline-offset-4 hover:underline" to="/login">
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </MagicCard>
    </AuthSplit>
  );
}
