import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Login from '../pages/Login';

// No real API calls in component tests
jest.mock('../api/authApi', () => ({
  getProviders: jest.fn().mockResolvedValue({ data: { google: true, facebook: false } }),
}));

function renderLogin(login = jest.fn()) {
  render(
    <AuthContext.Provider value={{ user: null, login }}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return login;
}

describe('Login page', () => {
  it('shows validation errors and does not call the API', async () => {
    const login = renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in with the entered credentials', async () => {
    const login = renderLogin(jest.fn().mockResolvedValue());

    await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(login).toHaveBeenCalledWith({ email: 'jane@test.com', password: 'Password123' });
  });

  it('shows the API error message when login fails', async () => {
    const error = { response: { data: { error: { message: 'Invalid email or password' } } } };
    renderLogin(jest.fn().mockRejectedValue(error));

    await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('shows only the configured social login buttons', async () => {
    renderLogin();

    expect(await screen.findByRole('link', { name: 'Google' })).toHaveAttribute('href', '/api/v1/auth/google');
    expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument();
  });
});
