import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceTable from '@/components/invoices/InvoiceTable';

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Chart + Table layout scaffold */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">Chart A</div>
        <div className="rounded-lg border p-4">Chart B</div>
        <div className="rounded-lg border p-4">Chart C</div>
        <div className="rounded-lg border p-4">Chart D</div>
      </section>

      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Table size={18} />
          <h3 className="text-lg font-medium">Data table</h3>
        </div>
        <InvoiceTable />
      </section>
    </DashboardLayout>
  );
}
