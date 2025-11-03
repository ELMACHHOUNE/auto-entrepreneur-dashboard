import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { api } from '@/api/axios';

type UserRole = 'user' | 'admin';
type IUser = {
  _id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  ICE?: string;
  service?: string;
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
      { accessorKey: 'fullName', header: 'Full name' },
      { accessorKey: 'phone', header: 'Phone' },
      { accessorKey: 'ICE', header: 'ICE' },
      { accessorKey: 'service', header: 'Service' },
    ],
    []
  );

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IUser | null>(null);
  const [form, setForm] = useState<{
    email: string;
    role: UserRole;
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    password?: string;
  }>({ email: '', role: 'user' });

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', role: 'user', password: '' });
    setModalOpen(true);
  };
  const openEdit = (u: IUser) => {
    setEditing(u);
    setForm({
      email: u.email,
      role: u.role,
      fullName: u.fullName || '',
      phone: u.phone || '',
      ICE: u.ICE || '',
      service: u.service || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing._id, payload: form });
    } else {
      if (!form.password || form.password.length < 6) return; // basic client check
      await createMutation.mutateAsync(form as Partial<IUser> & { password: string });
    }
    setModalOpen(false);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const table = useMantineReactTable<IUser>({
    columns,
    data: items,
    rowCount: total,
    enableRowActions: true,
    manualFiltering: true,
    manualPagination: true,
    state: {
      isLoading,
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: v => setGlobalFilter(v ?? ''),
    onPaginationChange: setPagination,
    renderTopToolbarCustomActions: () => (
      <Button onClick={openCreate} size="xs" variant="default">
        Create user
      </Button>
    ),
    renderRowActions: ({ row }: { row: { original: IUser } }) => (
      <Group gap="xs">
        <Button size="xs" variant="subtle" onClick={() => openEdit(row.original)}>
          Edit
        </Button>
        <Button
          size="xs"
          color="red"
          variant="subtle"
          onClick={() => deleteMutation.mutate(row.original._id)}
        >
          Delete
        </Button>
      </Group>
    ),
    mantineToolbarAlertBannerProps: isError
      ? { color: 'red', children: 'Error loading users' }
      : undefined,
  });

  return (
    <section className="mx-auto max-w-7xl p-2">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Manage users</h1>
        <p className="text-sm text-muted-foreground">Create, update, and delete user accounts.</p>
      </header>

      <MantineReactTable table={table} />

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit user' : 'Create user'}
      >
        <Stack>
          <TextInput
            label="Email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm(f => ({ ...f, email: e.currentTarget.value }))
            }
            required
          />
          {!editing && (
            <TextInput
              label="Password"
              placeholder="At least 6 characters"
              value={form.password || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm(f => ({ ...f, password: e.currentTarget.value }))
              }
              required
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
          />
          <TextInput
            label="Full name"
            value={form.fullName || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm(f => ({ ...f, fullName: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Phone"
            value={form.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm(f => ({ ...f, phone: e.currentTarget.value }))
            }
          />
          <TextInput
            label="ICE"
            value={form.ICE || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm(f => ({ ...f, ICE: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Service"
            value={form.service || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm(f => ({ ...f, service: e.currentTarget.value }))
            }
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
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
