'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';

const AccountView = () => {
  const user = useUser();
  const supabase = useSupabaseClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userDetails) {
      setFirstName(user.userDetails.first_name || '');
      setLastName(user.userDetails.last_name || '');
      setPhone(user.user?.phone ?? '');
    }
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);

    // 1. Update the `users` table with first_name, last_name, and phone (without updating the email yet)
    const { error: userTableError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      })
      .eq('id', user.user?.id);

   

   

    if (userTableError ) {
      console.error('Erro ao atualizar perfil:', userTableError);
      alert('Erro ao atualizar perfil');
    } else {
      alert('Perfil atualizado com sucesso!');
    }

    setLoading(false);
  };

  return (
    <div className="w-full flex flex-col gap-16">
      <h1 className="text-2xl font-bold ml-6 mb-4">Informações da conta</h1>

      {user ? (
        <>
          <div className="flex flex-col gap-14 items-start justify-between">
            <p className="text-lg ml-8 mb-4">Primeiro nome: {user.userDetails?.first_name ?? 'Não existe'}</p>
            <p className="text-lg ml-8 mb-4">Último nome: {user.userDetails?.last_name ?? 'Não existe'}</p>
            <p className="text-lg ml-8 mb-4">Telefone: {user.userDetails?.phone ?? 'Não existe'}</p>
            <p className="text-lg ml-8 mb-4">Email: {user.userDetails?.email}</p>
          </div>

          <h1 className="text-2xl font-bold ml-6 mb-4">Atualizar informações da conta</h1>
          <div className="text-white shadow-2xl ml-6 rounded-lg space-y-6 w-full">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col w-48">
                  <h1 className="text-lg font-semibold">Primeiro Nome</h1>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border p-2 rounded text-white"
                  />
                </div>
                <div className="flex flex-col w-48">
                  <h1 className="text-lg font-semibold">Último Nome</h1>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border p-2 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col w-48">
                <h1 className="text-lg font-semibold">Número de Telemóvel</h1>
                <p className='text-sm text-red-500'>(Inclua o código do seu país)</p>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)} // Update the phone state
                  className="border p-2 rounded text-white"
                />
              </div>

            

              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar dados'}
              </button>
            </div>


            <div>
              <h3 className="text-lg font-semibold mb-2">Membro desde</h3>
              <p className="text-gray-300">
                {user.user?.created_at
                  ? new Date(user.user.created_at).toLocaleDateString('pt-PT')
                  : 'Desconhecido'}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">
          <p>Você não está autenticado.</p>
        </div>
      )}
    </div>
  );
};

export default AccountView;
