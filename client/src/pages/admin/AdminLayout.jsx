import { NavLink, Outlet } from 'react-router-dom';

// Shell for every admin page: sidebar on the left, the selected page on the right
export default function AdminLayout() {
  return (
    <div className="admin">
      <aside>
        <h3>Admin Panel</h3>
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/posts">Posts</NavLink>
        <NavLink to="/admin/comments">Comments</NavLink>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
