'use client';

import { useUser } from '@/hooks/useUser';

const AccountView = () => {
  const user = useUser();

  return (
    <div className="w-full p-6 bg-gray-800 text-white rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Painel do utilizador</h1>

      {/* Show username */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Username:</h2>
        <p>{user.userDetails?.first_name ?? 'Não disponível'}</p>
      </div>

      {/* Show email */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Email:</h2>
        <p>{user.userDetails?.email ?? 'Não disponível'}</p>
      </div>

      {/* Show phone number */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Número de telefone:</h2>
        <p>{user.userDetails?.phone ?? 'Não disponível'}</p>
      </div>

      {/* Show role */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Cargo:</h2>
        <p>{user.userDetails?.role ?? 'Não disponível'}</p>
      </div>
    </div>
  );
};

export default AccountView;
