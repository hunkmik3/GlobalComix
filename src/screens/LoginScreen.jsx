import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Field, TextInput } from '../components/primitives.jsx';

export default function LoginScreen({ onLogin, initialError = '' }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const submit = async () => {
    if (loading) return;

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter email or username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onLogin(identifier.trim(), password);
      setLoading(false);
      if (!result.ok) setError(result.error);
    } catch (submitError) {
      setLoading(false);
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed.');
    }
  };

  return (
    <main className="gc-login">
      <section className="gc-login-card">
        <div className="gc-login-head">
          <h1>GLOBALCOMIX</h1>
          <p>Panel Tracker - Production Tool</p>
          <div />
        </div>

        <div className="gc-login-form">
          <Field label="Email / Username">
            <TextInput
              type="text"
              placeholder="admin or name@studio.com"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
            />
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              placeholder="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
            />
          </Field>

          {error ? <div className="gc-error">{error}</div> : null}

          <Button
            icon={ArrowRight}
            label={loading ? 'Signing in...' : 'Sign In'}
            primary
            className="gc-login-submit"
            onClick={submit}
            disabled={loading}
          />
        </div>

        <footer>Internal use only - GlobalComix Studio</footer>
      </section>
    </main>
  );
}
