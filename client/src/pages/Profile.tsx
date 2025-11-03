import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Briefcase, IdCard, Phone, User as UserIcon, Mail, Lock, CloudUpload } from 'lucide-react';
import { FileUploader, FileInput, type DropzoneOptions } from '@/components/ui/file-upload';
import AlertBanner from '@/components/ui/alert-banner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import guideData from '@/assets/data.json';

export default function Profile() {
  const { user, updateProfile, changePassword, updateAvatar } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    ICE: user?.ICE || '',
    service: user?.service || '',
    // structured fields
    profileKind: (user?.profileKind as '' | 'guide_auto_entrepreneur' | 'company_guide') || '',
    serviceCategory: user?.serviceCategory || '',
    serviceType: user?.serviceType || '',
    serviceActivity: user?.serviceActivity || '',
    companyTypeCode: user?.companyTypeCode || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  // Bust browser cache for avatar after successful upload
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    // Sync all fields from loaded user (covers first load and later refreshes)
    setForm(f => ({
      ...f,
      email: user?.email || '',
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      ICE: user?.ICE || '',
      service: user?.service || '',
      profileKind: (user?.profileKind as '' | 'guide_auto_entrepreneur' | 'company_guide') || '',
      serviceCategory: user?.serviceCategory || '',
      serviceType: user?.serviceType || '',
      serviceActivity: user?.serviceActivity || '',
      companyTypeCode: user?.companyTypeCode || '',
    }));
  }, [
    user?.email,
    user?.fullName,
    user?.phone,
    user?.ICE,
    user?.service,
    user?.profileKind,
    user?.serviceCategory,
    user?.serviceType,
    user?.serviceActivity,
    user?.companyTypeCode,
  ]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (form.fullName && form.fullName.trim().length < 2) e.fullName = 'Full name is too short';
    const digits = form.phone.replace(/\D/g, '');
    if (form.phone && (digits.length < 9 || digits.length > 15))
      e.phone = 'Enter a valid phone number';
    if (form.ICE && form.ICE.replace(/\D/g, '').length !== 15) e.ICE = 'ICE must be 15 digits';
    if (!form.email) e.email = 'Email is required';
    return e;
  }, [form]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!isValid) return;
    try {
      setSaving(true);
      // derive service similar to Register
      let derivedService = form.service;
      if (form.profileKind === 'guide_auto_entrepreneur') {
        derivedService = form.serviceActivity || '';
      } else if (form.profileKind === 'company_guide') {
        derivedService = form.companyTypeCode || '';
      }

      await updateProfile({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        ICE: form.ICE,
        service: derivedService,
        profileKind: (form.profileKind === '' ? undefined : form.profileKind) as
          | 'guide_auto_entrepreneur'
          | 'company_guide'
          | undefined,
        serviceCategory: form.serviceCategory || undefined,
        serviceType: form.serviceType || undefined,
        serviceActivity: form.serviceActivity || undefined,
        companyTypeCode: form.companyTypeCode || undefined,
      });
      if (avatarFile) {
        await updateAvatar(avatarFile);
        setAvatarFile(null);
        // increment version to force img reload even if URL path is identical
        setAvatarVersion(v => v + 1);
      }
      setOk(true);
    } catch {
      setErr('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Dropzone handles avatar selection; legacy input handler removed

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdErr(null);
    setPwdOk(false);
    if (!pwd.newPassword || pwd.newPassword.length < 6) {
      setPwdErr('New password must be at least 6 characters');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr('Passwords do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: pwd.currentPassword || undefined,
        newPassword: pwd.newPassword,
      });
      setPwdOk(true);
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      setPwdErr('Failed to change password');
    }
  };

  const baseURL = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '', []);
  const resolvedBase = useMemo(
    () => baseURL || (typeof window !== 'undefined' ? window.location.origin : ''),
    [baseURL]
  );

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl ">
        <h2 className="mb-4 text-2xl font-semibold">Profile settings</h2>
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-lg border p-4 bg-success/50 text-success-foreground"
        >
          {/* Avatar section: refined layout for better UX */}
          <div className="rounded-md bg-card/50 p-4">
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5 sm:gap-6">
              {/* Left: label + helper text */}
              <div className="sm:col-span-2">
                <label
                  id="profile-picture-label"
                  className="block text-sm font-medium text-foreground"
                >
                  Profile picture
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Square image (1:1) works best. PNG, JPG, GIF, or WEBP up to 2MB.
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
                  ) : user?.avatarUrl ? (
                    <img
                      src={`${resolvedBase}${user.avatarUrl}${
                        avatarVersion ? `?v=${avatarVersion}` : ''
                      }`}
                      alt="current avatar"
                      className="h-full w-full object-cover"
                      width={96}
                      height={96}
                      decoding="async"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No avatar</span>
                  )}
                </div>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => setAvatarFile(null)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Clear selection
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
                    aria-label="Upload profile picture"
                    className="rounded-md border border-dashed border-muted bg-background/60 outline-none transition hover:bg-muted/30"
                  >
                    <div className="flex w-full flex-col items-center justify-center px-3 py-3 text-center text-foreground">
                      <CloudUpload
                        className="mb-1 h-6 w-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="mb-1 text-xs">
                        <span className="font-semibold">Click to upload</span>&nbsp; or drag and
                        drop
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        PNG, JPG, GIF, WEBP (max 2MB)
                      </p>
                    </div>
                  </FileInput>
                </FileUploader>
              </div>
            </div>
          </div>
          {/* Email */}
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="Email"
              value={form.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600">
              {errors.email}
            </p>
          )}
          <div className="relative">
            <UserIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="Full name"
              value={form.fullName}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-red-600">
              {errors.fullName}
            </p>
          )}
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{9,15}"
              maxLength={15}
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="Phone"
              value={form.phone}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="text-sm text-red-600">
              {errors.phone}
            </p>
          )}
          <div className="relative">
            <IdCard
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              inputMode="numeric"
              pattern="[0-9]{15}"
              maxLength={15}
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="ICE (15 digits)"
              value={form.ICE}
              aria-invalid={Boolean(errors.ICE)}
              aria-describedby={errors.ICE ? 'ice-error' : undefined}
              onChange={e => setForm({ ...form, ICE: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          {errors.ICE && (
            <p id="ice-error" className="text-sm text-red-600">
              {errors.ICE}
            </p>
          )}
          {/* Profile kind selector */}
          <div className="relative">
            <Briefcase
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <select
              className="w-full rounded border bg-card p-2 pl-9 text-foreground"
              value={form.profileKind}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  profileKind: e.target.value as '' | 'guide_auto_entrepreneur' | 'company_guide',
                  // Reset dependent fields when kind changes
                  serviceCategory: '',
                  serviceType: '',
                  serviceActivity: '',
                  companyTypeCode: '',
                }))
              }
            >
              <option value="">Select profile type</option>
              <option value="guide_auto_entrepreneur">Auto-entrepreneur guide</option>
              <option value="company_guide">Company guide</option>
            </select>
          </div>

          {/* Conditional selects for Auto-entrepreneur */}
          {form.profileKind === 'guide_auto_entrepreneur' && (
            <>
              {/* Category */}
              <div className="relative">
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceCategory}
                  onChange={e => {
                    const nextCat = e.target.value;
                    const section = guideData.guide_auto_entrepreneur.sections.find(
                      s => s.category === nextCat
                    );
                    setForm(f => ({
                      ...f,
                      serviceCategory: nextCat,
                      serviceType: section?.type || '',
                      serviceActivity: '',
                    }));
                  }}
                >
                  <option value="">Select category</option>
                  {guideData.guide_auto_entrepreneur.sections.map(sec => (
                    <option key={sec.category} value={sec.category}>
                      {sec.category}
                    </option>
                  ))}
                </select>
              </div>
              {/* Type (derived from category) */}
              <div className="relative">
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                >
                  <option value="">Select type</option>
                  {form.serviceCategory &&
                    (() => {
                      const section = guideData.guide_auto_entrepreneur.sections.find(
                        s => s.category === form.serviceCategory
                      );
                      return section ? <option value={section.type}>{section.type}</option> : null;
                    })()}
                </select>
              </div>
              {/* Activity */}
              <div className="relative">
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceActivity}
                  onChange={e => setForm(f => ({ ...f, serviceActivity: e.target.value }))}
                  disabled={!form.serviceCategory}
                >
                  <option value="">Select activity</option>
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
            </>
          )}

          {/* Conditional select for Company */}
          {form.profileKind === 'company_guide' && (
            <div className="relative">
              <select
                className="w-full rounded border bg-card p-2 text-foreground"
                value={form.companyTypeCode}
                onChange={e => setForm(f => ({ ...f, companyTypeCode: e.target.value }))}
              >
                <option value="">Select company type code</option>
                {guideData.company_guide.types.map(t => (
                  <option key={t.code} value={t.code}>
                    {t.code} — {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <AlertBanner
            open={Boolean(err)}
            variant="error"
            title="Update failed"
            description={err || 'Failed to update profile'}
            onClose={() => setErr(null)}
          />
          <AlertBanner
            open={ok}
            variant="success"
            title="Profile updated"
            description="Your changes have been saved."
            autoClose={3000}
            onClose={() => setOk(false)}
          />
          <div>
            <InteractiveHoverButton
              type="submit"
              disabled={!isValid || saving}
              className="w-full bg-accent/80 text-accent-foreground"
            >
              Save changes
            </InteractiveHoverButton>
          </div>
        </form>

        {/* Change Password */}
        <form
          onSubmit={onChangePassword}
          className="mt-6 space-y-3 rounded-lg border p-4 bg-success/50 text-success-foreground"
        >
          <h3 className="text-lg font-medium">Change password</h3>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="Current password (if set)"
              value={pwd.currentPassword}
              onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="New password"
              value={pwd.newPassword}
              onChange={e => setPwd({ ...pwd, newPassword: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border bg-card text-foreground placeholder:text-muted-foreground p-2 pl-9"
              placeholder="Confirm new password"
              value={pwd.confirm}
              onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
          <AlertBanner
            open={Boolean(pwdErr)}
            variant="error"
            title="Password update failed"
            description={pwdErr || 'Failed to change password'}
            onClose={() => setPwdErr(null)}
          />
          <AlertBanner
            open={pwdOk}
            variant="success"
            title="Password changed"
            description="Your password was updated successfully."
            autoClose={3000}
            onClose={() => setPwdOk(false)}
          />
          <div>
            <InteractiveHoverButton
              type="submit"
              className="w-full bg-accent/80 text-accent-foreground"
            >
              Update password
            </InteractiveHoverButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
