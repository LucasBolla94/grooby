'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    keepLoggedIn: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister) {
      if (
        !form.name ||
        !form.lastName ||
        !form.email ||
        !form.password ||
        !form.confirmPassword
      ) {
        return setError('Please fill in all required fields.');
      }

      if (form.password !== form.confirmPassword) {
        return setError('Passwords do not match.');
      }

      if (!form.acceptTerms) {
        return setError('You must accept the terms of service.');
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: form.name,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          createdAt: new Date(),
        });

        setSuccess('Registration completed!');
        setTimeout(() => {
          setIsRegister(false);
          setForm({
            name: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
            keepLoggedIn: false,
          });
          setSuccess('');
        }, 1500);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      }
    } else {
      try {
        await setPersistence(
          auth,
          form.keepLoggedIn ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setSuccess('Login efetuado com sucesso!');
        setTimeout(() => {
          router.push('/dash');
        }, 2000);
      } catch {
        setError('Invalid email or password.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-10 bg-gray-900">
      <Image
        src="/bg.png"
        alt="Background"
        fill
        className="object-cover opacity-30 absolute z-0"
      />
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
          {isRegister ? 'Create your Grooby Account' : 'Login to Grooby'}
        </h1>

        {error && <div className="mb-4 text-red-400 text-sm text-center">{error}</div>}
        {success && <div className="mb-4 text-green-400 text-sm text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                name="name"
                placeholder="First Name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
                className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
          />

          {isRegister && (
            <input
              type="tel"
              name="phone"
              placeholder="Phone (UK format: +44...)"
              value={form.phone}
              onChange={handleChange}
              pattern="^\+44\d{10}$"
              className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
          />

          {isRegister && (
            <>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-type Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg px-4 py-3 bg-white/20 placeholder-white/60"
              />
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="mr-2"
                />
                I accept the{' '}
                <a href="#" className="underline ml-1">
                  Terms of Service
                </a>
              </label>
            </>
          )}

          {!isRegister && (
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                name="keepLoggedIn"
                checked={form.keepLoggedIn}
                onChange={handleChange}
                className="mr-2"
              />
              Keep me logged in for 7 days
            </label>
          )}

          <button
            type="submit"
            className="w-full bg-white text-black rounded-full py-3 font-semibold hover:bg-gray-200 transition"
          >
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-sm text-center">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-400 underline"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-400 underline"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
