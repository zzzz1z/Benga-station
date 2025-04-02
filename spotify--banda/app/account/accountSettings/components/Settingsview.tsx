'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const AccountView = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [musicStyle, setMusicStyle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userDetails) {
      const fullName = user.userDetails.full_name?.split(' ') || [];
      setFirstName(fullName[0] || '');
      setLastName(fullName.slice(1).join(' ') || '');
      setPhone(user.user?.phone ?? '');
    }
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone })
      .eq('id', user.user?.id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
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

        <div className='flex flex-col gap-14 items-start justify-between'>


           

                <p className='text-2xl ml-6 mb-4'>Primeiro nome: {user.userDetails?.first_name ?? 'Não existe'}</p>

                <p className='text-2xl ml-6 mb-4'>Último nome: {user.userDetails?.last_name ?? 'Não existe'}</p>

                <p className='text-2xl ml-6 mb-4'>Telefone: {user.user?.new_phone ?? 'Não existe'}</p>
  

           

            

        </div>


        <h1 className="text-2xl font-bold ml-6 mb-4">Actualizar informações da conta</h1>
        <div className=" text-white shadow-2xl ml-6  rounded-lg space-y-6 w-full ">
          {/* Editable Form */}

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex flex-col w-48">
                    
                        <label className="text-sm font-semibold">Primeiro Nome</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="border p-2 rounded text-black"
                        />
                    </div>
              <div className="flex flex-col w-48">
                <label className="text-sm font-semibold">Último Nome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border p-2 rounded text-black"
                />
              </div>
            </div>

            <div className="flex flex-col w-48">
              <label className="text-sm font-semibold">Número de Telemóvel</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded text-black"
              />
            </div>


            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Salvar Alterações'}
            </button>
          </div>

          {/* Account Creation Date */}
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
