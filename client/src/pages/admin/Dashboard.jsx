import { getActivity, getStats } from '../../api/adminApi';
import useFetch from '../../hooks/useFetch';

export default function Dashboard() {
  const stats = useFetch(getStats);
  const activity = useFetch(() => getActivity({ limit: 10 }));

  return (
    <div>
      <h1>Dashboard</h1>

      {stats.error && <p className="error">{stats.error}</p>}
      {stats.data && (
        <div className="stats">
          <div className="stat">
            <span>{stats.data.users}</span>
            Users
          </div>
          <div className="stat">
            <span>{stats.data.posts}</span>
            Posts
          </div>
          <div className="stat">
            <span>{stats.data.comments}</span>
            Comments
          </div>
        </div>
      )}

      <h2>Recent activity</h2>
      {activity.loading && <p>Loading...</p>}
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {activity.data?.map((log) => (
            <tr key={log._id}>
              <td>{log.user?.name}</td>
              <td>{log.action}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
