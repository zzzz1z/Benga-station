'use client';

import { useUser } from '@/hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState } from 'react';

const PrivacyContent = () => {
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useUser()

  // Update email
  const updateEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      alert('Email atualizado com sucesso!');
    } catch (error) {

     console.log(error)
    } finally {
      setLoading(false);
    }
  };

  // Update phone number
  const updatePhoneNumber = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.getUser();
      if (error) throw error;

      const { error: userError } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', user.userDetails?.id);

      if (userError) throw userError;
      alert('Número de telefone atualizado com sucesso!');
    } catch (error) {
      console.log(error)
   
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    setLoading(true);
    try {
      if (!oldPassword || !newPassword) {
        throw new Error('Por favor, forneça ambos os campos de senha');
      }

      const {error } = await supabase.auth.getUser();
      if (error) throw error;

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) throw passwordError;
      alert('Senha atualizada com sucesso!');
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-gray-800 text-white rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Atualizar Informações de Privacidade</h1>


      {/* Update Email */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Atualizar Email</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Novo Email"
          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={updateEmail}
          className="w-full mt-4 p-2 bg-blue-500 rounded text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar Email'}
        </button>
      </div>

      {/* Update Phone Number */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Atualizar Número de Telefone</h2>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Novo Número de Telefone"
          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={updatePhoneNumber}
          className="w-full mt-4 p-2 bg-green-500 rounded text-white hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar Telefone'}
        </button>
      </div>

      {/* Update Password */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Atualizar Senha</h2>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Senha Antiga"
          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nova Senha"
          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={updatePassword}
          className="w-full mt-4 p-2 bg-red-500 rounded text-white hover:bg-red-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar Senha'}
        </button>
      </div>
    </div>
  );
};

export default PrivacyContent;
