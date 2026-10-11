import { useEffect, useState } from 'react';
import { getProviders } from '../api/authApi';

// Only shows the buttons for providers configured in the server's .env.
// These are plain links: the browser goes to the API, which redirects to Google/Facebook.
export default function SocialLoginButtons() {
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    getProviders()
      .then((res) => setProviders(res.data))
      .catch(() => {});
  }, []);

  if (!providers.google && !providers.facebook) return null;

  return (
    <div className="social">
      <p className="muted">or continue with</p>
      {providers.google && (
        <a className="btn btn-light" href="/api/v1/auth/google">
          Google
        </a>
      )}
      {providers.facebook && (
        <a className="btn btn-light" href="/api/v1/auth/facebook">
          Facebook
        </a>
      )}
    </div>
  );
}
