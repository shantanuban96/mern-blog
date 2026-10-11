import { useState } from 'react';
import { getUsers, updateUser } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: users, meta, loading, error, reload } = useFetch(() => getUsers({ page, search }), [page, search]);

  const changeUser = async (id, changes) => {
    try {
      await updateUser(id, changes);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => {
            const isMe = u._id === me._id; // admins can't change themselves
            return (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email || '-'}</td>
                <td>
                  <select value={u.role} disabled={isMe} onChange={(e) => changeUser(u._id, { role: e.target.value })}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <button
                    className={`btn btn-small ${u.isActive ? 'btn-danger' : ''}`}
                    disabled={isMe}
                    onClick={() => changeUser(u._id, { isActive: !u.isActive })}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
