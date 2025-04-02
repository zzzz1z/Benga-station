import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

const AccountView = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  return (
    <div className="w-full ">
      <h1 className="text-2xl font-bold mb-2 ml-6">Painel do Utilizador</h1>

      {user ? (
        <div className=" flex justify-between flex-wrap h-96 bg-grey-900 shadow-2xl p-6 rounded-lg">
          {/* User Info Section */}
          <div className="flex items-start flex-col space-y-3">
            {/* Full Name */}
            <h2 className="text-xl font-semibold">
              {user.userDetails?.full_name ?? (
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => router.push('/account/accountSettings')}
                >
                  Adicionar Nome
                </button>
              )}
            </h2>

            {/* Email */}
            <h2 className="text-lg text-gray-600">{user.user?.email}</h2>
            <button onClick={()=> router.push('/account/accountPrivacy')} className='text-black'>Mudar endereço de email</button>
            <button onClick={()=> router.push('/account/accountPrivacy')} className='text-black'>Alterar palavra-passe</button>

            {/* Phone Number */}
            
          </div>
          

         

          {/* Recently Played Songs */}
          <div className='h-52'>
            <h3 className="text-lg font-semibold mb-2 text-blue-500">Músicas Recentes</h3>
            {/* TODO: Add logic to fetch & display recent songs */}
            <p className="text-gray-500 italic">Nenhuma música reproduzida recentemente.</p>
          </div> 
          
          
          
        

          {/* User Role */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-500">Função do Utilizador</h3>
            {/* TODO: Fetch user role from Supabase */}
            <p className="text-gray-500 italic">{user.user?.role}.</p>
          </div>  
          
          
          <div className="flex w-full">

          <h2 className="text-xl text-black hover:underline font-semibold">
              Membro desde: {user.user?.created_at}
          </h2>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p>Você não está autenticado.</p>
        </div>
      )}
    </div>
  );
};

export default AccountView;
