import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

const AccountView = () => {
  const user = useUser()
  const supabase = useSupabaseClient()

  const router = useRouter()

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Painel do utilizador</h1>
      {user ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
          
            <div>
              <h2 className='text-xl'>{user.userDetails?.full_name ?? (
                <button className='cursor-pointer' onClick={()=> router.push('/accountSettings')}>
                  Adicionar nome
                </button>)}</h2>

              <h2 className="text-xl">{user.user?.email}</h2>


              <h2 className='text-xl'>{user.user?.phone ?? (
                <button className='cursor-pointer' onClick={()=> router.push('/accountSettings')}>
                  Adicionar número do telemóvel
                </button>)}</h2>
            
            </div>
          </div>



        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
        </div>
      )}
    </div>
  );
};

export default AccountView;
