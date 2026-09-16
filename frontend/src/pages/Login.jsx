import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { ArrowRightIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import Brand from '../components/Brand';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.username, formData.password);
      setAuth(response.access, response.refresh, response.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Кирүүдө ката. Маалыматтарды текшериңиз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e2338] px-4 py-10">
      <div className="absolute -left-24 -top-28 h-96 w-96 rounded-full bg-[#3fa76b]/20 blur-3xl" />
      <div className="absolute -bottom-32 right-0 h-[30rem] w-[30rem] rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.1fr_.9fr]">
        <section className="hidden min-h-[590px] flex-col justify-between bg-[#16324f] p-10 text-white lg:flex">
          <Brand light />
          <div><p className="max-w-sm text-3xl font-extrabold leading-tight">Финансы жана окуу процесси — бир жерде.</p><p className="mt-5 max-w-md text-sm leading-6 text-slate-300">Ар бир операция көзөмөлдөнөт, ал эми кызматкерлер өз ролуна ылайык гана иштейт.</p></div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ITadis. Корголгон тутум.</p>
        </section>
        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full">
        <div className="mb-8">
          <div className="mb-6 lg:hidden"><Brand /></div>
          <h2 className="text-3xl font-extrabold text-[#0e2338]">Кош келиңиз</h2>
          <p className="mt-2 text-sm text-slate-500">Иш мейкиндигиңизге кирүү үчүн маалыматтарыңызды жазыңыз.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="label">Логин</label>
              <div className="relative"><UserIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-slate-400" /><input
                id="username"
                name="username"
                type="text"
                required
                className="input pl-11"
                placeholder="Логин"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              /></div>
            </div>
            <div>
              <label htmlFor="password" className="label">Сырсөз</label>
              <div className="relative"><LockClosedIcon className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-slate-400" /><input
                id="password"
                name="password"
                type="password"
                required
                className="input pl-11"
                placeholder="Сырсөз"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              /></div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Кирүү...' : <><span>Кирүү</span><ArrowRightIcon className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">Коопсуз кирүү: сырсөздөр шифрленип сакталат, ал эми аракеттер аудит журналына жазылат.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
