'use client';

import * as Label from '@radix-ui/react-label';
import { type ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createUserAction, type CreateUserState } from './actions';
import { ROLE_OPTIONS } from '@/lib/roles';

const initialState: CreateUserState = {};

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="form-stack">
      <div className="form-grid">
        <div className="form-group">
          <Label.Root htmlFor="name">Full name</Label.Root>
          <input id="name" name="name" className="input" placeholder="Jane Doe" required autoComplete="name" />
        </div>
        <div className="form-group">
          <Label.Root htmlFor="email">Email</Label.Root>
          <input id="email" name="email" type="email" className="input" placeholder="user@example.com" required autoComplete="email" />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <Label.Root htmlFor="password">Temporary password</Label.Root>
          <input id="password" name="password" type="password" className="input" required autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
        <div className="form-group">
          <Label.Root htmlFor="role">Role</Label.Root>
          <select id="role" name="role" className="select" defaultValue="member">
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error ? <div className="form-error">{state.error}</div> : null}
      {state?.success ? <div className="form-success">User created successfully.</div> : null}

      <div className="form-actions">
        <SubmitButton>Create user</SubmitButton>
      </div>
    </form>
  );
}

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Saving...' : children}
    </button>
  );
}
