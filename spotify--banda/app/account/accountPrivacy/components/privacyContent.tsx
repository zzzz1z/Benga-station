'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';

const PrivacyContent = () => {
  const user = useUser();
  const supabase = useSupabaseClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailUpdatePending, setEmailUpdatePending] = useState(false);
  const [phoneUpdatePending, setPhoneUpdatePending] = useState(false);

  useEffect(() => {
    if (user?.userDetails) {
      setFirstName(user.userDetails.first_name || '');
      setLastName(user.userDetails.last_name || '');
      setPhone(user.user?.phone ?? '');
      setEmail(user.user?.email ?? '');
    }
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);
    setEmailUpdatePending(false);
    setPhoneUpdatePending(false);

    // 1. Update the `users` table with first_name, last_name, and phone (without updating the email yet)
    const { error: userTableError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      })
      .eq('id', user.user?.id);

    // 2. If email has changed, update `auth.users` to trigger email verification
    let emailChangeError = null;
    if (email !== user.user?.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: email,
      });

      if (authError) {
        emailChangeError = authError;
        alert('Erro ao atualizar o email');
      } else {
        setEmailUpdatePending(true); // Email update is pending confirmation
        alert('Email alterado. Verifique sua caixa de entrada para confirmar.');
      }
    }

    // 3. If phone has changed, update `auth.users` to trigger phone verification
    let phoneChangeError = null;
    if (phone !== user.user?.phone) {
      const { error: phoneError } = await supabase.auth.updateUser({
        phone: phone,
      });

      if (phoneError) {
        phoneChangeError = phoneError;
        alert('Erro ao atualizar o número de telefone');
      } else {
        setPhoneUpdatePending(true); // Phone update is pending confirmation
        alert('Número de telefone alterado. Verifique sua caixa de entrada para confirmar.');
      }
    }

    if (userTableError || emailChangeError || phoneChangeError) {
      console.error('Erro ao atualizar perfil:', userTableError || emailChangeError || phoneChangeError);
      alert('Erro ao atualizar perfil');
    } else {
      alert('Perfil atualizado com sucesso!');
    }

    setLoading(false);
  };

  return (
    <>
    ya
    </>
  );
};

export default PrivacyContent;
