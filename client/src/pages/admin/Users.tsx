import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MRT_ColumnDef } from 'mantine-react-table';
import { Button, Group, Modal, Select, Stack, TextInput, ActionIcon, Tooltip } from '@mantine/core';
import {
  selectFilledStyles,
  inputFilledStyles,
  buttonAccentStyles,
  buttonNeutralStyles,
  modalStyles,
} from '@/components/ui/mantineStyles';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/table/DataTable';
import guideData from '@/assets/data.json';
import { api } from '@/api/axios';

type UserRole = 'user' | 'admin';
type IUser = {
  _id: string;
  email: string;
  role: UserRole;
  plan?: 'freemium' | 'premium';
  fullName?: string;
  phone?: string;
  ICE?: string;
  service?: string;
  // Structured service fields
  profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
  serviceCategory?: string;
  serviceType?: string;
  serviceActivity?: string;
  companyTypeCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

type UsersResponse = {
  items: IUser[];
  total: number;
  page: number;
  limit: number;
};

export default function Users() {
  const qc = useQueryClient();
  const { user: authUser, refresh: refreshAuth } = useAuth();
  // Table state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');

  const safeSearch = (globalFilter ?? '').trim();

  const { data, isLoading, isError } = useQuery<UsersResponse>({
    queryKey: ['admin-users', pagination.pageIndex, pagination.pageSize, safeSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        search: safeSearch,
      });
      const { data } = await api.get(`/api/admin/users?${params.toString()}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<IUser> & { password: string }) => {
      const { data } = await api.post('/api/admin/users', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<IUser> & { password?: string };
    }) => {
      const { data } = await api.patch(`/api/admin/users/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/admin/users/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Columns
  const columns = useMemo<MRT_ColumnDef<IUser>[]>(
    () => [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
      {
        accessorKey: 'plan',
        header: 'Plan',
        Cell: ({ cell }) => (
          <span className="tabular-nums font-medium">
            {cell.getValue<string>() === 'premium' ? 'Premium' : 'Freemium'}
          </span>
        ),
      },
      { accessorKey: 'fullName', header: 'Full name' },
      { accessorKey: 'phone', header: 'Phone' },
      { accessorKey: 'ICE', header: 'ICE' },
      { accessorKey: 'service', header: 'Service' },
      // New structured columns (read-only display)
      {
        header: 'Profile',
        accessorFn: (row: IUser) =>
          row.profileKind === 'guide_auto_entrepreneur'
            ? 'Auto-entrepreneur'
            : row.profileKind === 'company_guide'
            ? 'Company'
            : '',
        id: 'profileKindLabel',
      },
      { accessorKey: 'serviceCategory', header: 'Category' },
      { accessorKey: 'serviceType', header: 'Type' },
      { accessorKey: 'serviceActivity', header: 'Activity' },
      { accessorKey: 'companyTypeCode', header: 'Company code' },
    ],
    []
  );

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IUser | null>(null);
  const [form, setForm] = useState<{
    email: string;
    role: UserRole;
    plan: 'freemium' | 'premium';
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    password?: string;
    // structured fields
    profileKind?: '' | 'guide_auto_entrepreneur' | 'company_guide';
    serviceCategory?: string;
    serviceType?: string;
    serviceActivity?: string;
    companyTypeCode?: string;
  }>({ email: '', role: 'user', plan: 'freemium', profileKind: '' });

  const openCreate = () => {
    setEditing(null);
    setForm({
      email: '',
      role: 'user',
      plan: 'freemium',
      password: '',
      profileKind: '',
      serviceCategory: '',
      serviceType: '',
      serviceActivity: '',
      companyTypeCode: '',
    });
    setModalOpen(true);
  };
  const openEdit = (u: IUser) => {
    setEditing(u);
    setForm({
      email: u.email,
      role: u.role,
      plan: u.plan === 'premium' ? 'premium' : 'freemium',
      fullName: u.fullName || '',
      phone: u.phone || '',
      ICE: u.ICE || '',
      service: u.service || '',
      profileKind: (u.profileKind as '' | 'guide_auto_entrepreneur' | 'company_guide') || '',
      serviceCategory: u.serviceCategory || '',
      serviceType: u.serviceType || '',
      serviceActivity: u.serviceActivity || '',
      companyTypeCode: u.companyTypeCode || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // derive service to keep legacy field in sync
    let derivedService = form.service;
    if (form.profileKind === 'guide_auto_entrepreneur') {
      derivedService = form.serviceActivity || '';
    } else if (form.profileKind === 'company_guide') {
      derivedService = form.companyTypeCode || '';
    }
    const payload = {
      ...form,
      service: derivedService,
      // narrow type for profileKind
      profileKind: (form.profileKind === '' ? undefined : form.profileKind) as
        | 'guide_auto_entrepreneur'
        | 'company_guide'
        | undefined,
    } as Partial<IUser> & { password?: string };
    if (editing) {
      const prevPlan = editing.plan;
      await updateMutation.mutateAsync({ id: editing._id, payload });
      // If editing current logged-in user and plan changed, refresh auth context
      if (
        editing._id === authUser?._id &&
        typeof form.plan !== 'undefined' &&
        prevPlan !== form.plan
      ) {
        await refreshAuth();
      }
    } else {
      if (!form.password || form.password.length < 6) return; // basic client check
      await createMutation.mutateAsync(payload as Partial<IUser> & { password: string });
    }
    setModalOpen(false);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const renderRowActions = ({ row }: { row: { original: IUser } }) => (
    <Group gap="xs">
      <Tooltip label="Edit" withArrow>
        <ActionIcon
          variant="subtle"
          color="primary"
          size="sm"
          aria-label="Edit user"
          onClick={() => openEdit(row.original)}
        >
          <Pencil size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete" withArrow>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          aria-label="Delete user"
          onClick={() => deleteMutation.mutate(row.original._id)}
        >
          <Trash2 size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );

  const topActions = () => (
    <Button onClick={openCreate} size="xs" styles={buttonAccentStyles}>
      Create user
    </Button>
  );

  return (
    <section className="mx-auto max-w-7xl p-2">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Manage users</h1>
        <p className="text-sm text-muted-foreground">Create, update, and delete user accounts.</p>
      </header>
      <DataTable<IUser>
        columns={columns}
        data={items}
        rowCount={total}
        enableRowActions
        manualFiltering
        manualPagination
        loading={isLoading}
        error={isError}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        renderRowActions={renderRowActions}
        renderTopToolbarCustomActions={topActions}
        borderTone="accent"
      />

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit user' : 'Create user'}
        size="md"
        radius="md"
        shadow="md"
        overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={editing ? modalStyles.accent : modalStyles.success}
      >
        <Stack>
          <TextInput
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e?.currentTarget?.value ?? '' }))}
            required
            variant="filled"
            styles={inputFilledStyles}
          />
          {!editing && (
            <TextInput
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password || ''}
              onChange={e => setForm(f => ({ ...f, password: e?.currentTarget?.value ?? '' }))}
              required
              variant="filled"
              styles={inputFilledStyles}
            />
          )}
          <Select
            label="Role"
            value={form.role}
            onChange={(v: string | null) =>
              setForm(f => ({ ...f, role: ((v as UserRole) ?? 'user') as UserRole }))
            }
            data={[
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' },
            ]}
            variant="filled"
            styles={selectFilledStyles}
          />
          <Select
            label="Plan"
            value={form.plan}
            onChange={(v: string | null) =>
              setForm(f => ({ ...f, plan: v === 'premium' ? 'premium' : 'freemium' }))
            }
            data={[
              { label: 'Freemium (50MB)', value: 'freemium' },
              { label: 'Premium (500MB)', value: 'premium' },
            ]}
            variant="filled"
            styles={selectFilledStyles}
          />
          <TextInput
            label="Full name"
            value={form.fullName || ''}
            onChange={e => setForm(f => ({ ...f, fullName: e?.currentTarget?.value ?? '' }))}
            variant="filled"
            styles={inputFilledStyles}
          />
          <TextInput
            label="Phone"
            type="number"
            value={form.phone || ''}
            onChange={e => setForm(f => ({ ...f, phone: e?.currentTarget?.value ?? '' }))}
            variant="filled"
            styles={inputFilledStyles}
          />
          <TextInput
            label="ICE"
            type="number"
            value={form.ICE || ''}
            onChange={e => setForm(f => ({ ...f, ICE: e?.currentTarget?.value ?? '' }))}
            variant="filled"
            styles={inputFilledStyles}
          />
          {/* Profile kind selector */}
          <div>
            <label className="mb-1 block text-sm font-medium">Profile type</label>
            <select
              className="w-full rounded border bg-card p-2 text-foreground"
              value={form.profileKind}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  profileKind: e.target.value as '' | 'guide_auto_entrepreneur' | 'company_guide',
                  serviceCategory: '',
                  serviceType: '',
                  serviceActivity: '',
                  companyTypeCode: '',
                }))
              }
            >
              <option value="">None</option>
              <option value="guide_auto_entrepreneur">Auto-entrepreneur guide</option>
              <option value="company_guide">Company guide</option>
            </select>
          </div>

          {form.profileKind === 'guide_auto_entrepreneur' && (
            <>
              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceCategory || ''}
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
              {/* Type */}
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceType || ''}
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
              <div>
                <label className="mb-1 block text-sm font-medium">Activity</label>
                <select
                  className="w-full rounded border bg-card p-2 text-foreground"
                  value={form.serviceActivity || ''}
                  onChange={e => setForm(f => ({ ...f, serviceActivity: e.target.value }))}
                  disabled={!form.serviceCategory}
                >
                  <option value="">Select activity</option>
                  {form.serviceCategory &&
                    guideData.guide_auto_entrepreneur.sections
                      .find(s => s.category === form.serviceCategory)
                      ?.activities.map((act: string) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                </select>
              </div>
            </>
          )}

          {form.profileKind === 'company_guide' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Company type code</label>
              <select
                className="w-full rounded border bg-card p-2 text-foreground"
                value={form.companyTypeCode || ''}
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
          <Group justify="flex-end" mt="md" gap="xs">
            <Button
              variant="outline"
              styles={buttonNeutralStyles}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              styles={buttonAccentStyles}
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}
