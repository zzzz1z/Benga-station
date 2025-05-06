'use client';

import { useUser } from '@/hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Settingsview = () => {
  const supabase = useSupabaseClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useUser()
  const router = useRouter();

const updateNames = async () => {
  setLoading(true);

  if (!user.user) {
    alert('Usuário não autenticado.');
    setLoading(false);
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq('id', user.user.id);

  if (error) {
    console.error('Erro ao atualizar nomes:', error);
    alert('Erro ao atualizar nomes.');
  } else {
    alert('Nomes atualizados com sucesso!');
    router.refresh(); // <- refresh the view
  }

  setLoading(false);
};

  

  return (
    <div className="w-full p-6 bg-gray-800 text-white rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Atualizar Informações da conta</h1>


      {/* Update firstName */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Primeiro nome:</h2>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
      
      </div>

   

      {/* Update Password */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">último nome:</h2>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}

          className="w-full p-2 mt-2 rounded bg-gray-700 text-white"
        />
     
      </div> 
      
      <button
          onClick={updateNames}
          className="w-full mt-4 p-2 bg-red-500 rounded text-white hover:bg-red-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar dados'}
        </button>
    </div>
  );
};

export default Settingsview;
