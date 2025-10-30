import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
      <div className="border rounded p-4">
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Name:</strong> {user?.fullName || '-'}
        </p>
        <p>
          <strong>Role:</strong> {user?.role}
        </p>
      </div>
      <InteractiveHoverButton onClick={logout}>Logout</InteractiveHoverButton>
    </div>
  );
}
