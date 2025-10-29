import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
      <div className="border rounded p-4 bg-white">
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Name:</strong> {user?.fullName || "-"}
        </p>
        <p>
          <strong>Role:</strong> {user?.role}
        </p>
      </div>
      <button className="mt-4 border px-3 py-2 rounded" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
