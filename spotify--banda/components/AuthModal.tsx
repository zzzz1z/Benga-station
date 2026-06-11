"use client";

import { createClient } from "@/utils/supabase/client";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import useAuthModal from "@/hooks/useAuthModal";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { markDataStale } from "./FloatingRefreshButton";

const supabase = createClient();

const AuthModal = () => {
    const router = useRouter();
    const authModal = useAuthModal();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const checkIfEmailExists = async (email: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/exists?email=${encodeURIComponent(email)}`);
            if (!res.ok) return false;
            const { exists } = await res.json();
            return exists;
        } catch {
            toast.error("Erro ao verificar o email. Tente novamente.");
            return false;
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const emailExists = await checkIfEmailExists(email);
            if (emailExists) {
                toast.error("Este email já está registrado. Use outro.");
                setLoading(false);
                return;
            }
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                toast.error("Erro ao criar conta. Tente novamente.");
            } else {
                toast.success("Conta criada com sucesso! Verifique seu email.");
            }
        } catch {
            toast.error("Ocorreu um erro. Tente novamente.");
        }
        setLoading(false);
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error("Por favor verifique o seu email para poder iniciar sessão.");
            }
        } catch {
            toast.error("Ocorreu um erro. Tente novamente.");
        }
        setLoading(false);
    };

    const resendMail = async () => {
        if (!email) { toast.error("Insira o email primeiro."); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({ type: "signup", email });
            if (error) {
                toast.error("Erro ao reenviar o email.");
            } else {
                toast.success("Email de confirmação reenviado!");
                setResendCooldown(60);
            }
        } catch {
            toast.error("Erro inesperado.");
        }
        setLoading(false);
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event !== 'SIGNED_IN' || !session?.user) return;

                // upsert user row via VPS — no direct Supabase client call
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: session.user.id,
                        email: session.user.email,
                    }),
                });

                markDataStale();
                authModal.onClose();
            }
        );

        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const onChange = (open: boolean) => {
        if (!open) authModal.onClose();
    };

    return (
        <Modal
            title={authModal.mode === "sign_up" ? "Criar Conta" : "Iniciar sessão"}
            description={
                authModal.mode === "sign_up"
                    ? "Introduza os seus dados para criar uma conta! 🚀"
                    : "Introduza os seus dados para iniciar sessão. Caso não tenha uma conta, crie uma primeiro! 👋🏿"
            }
            isOpen={authModal.isOpen}
            onChange={onChange}
        >
            <div>
                {authModal.mode === "sign_up" ? (
                    <div className="flex flex-col gap-4">
                        <input type="email" placeholder="Introduza o seu email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-2 border rounded-md" />
                        <input type="password" placeholder="Introduza a sua palavra passe" value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-2 border rounded-md" />
                        <p className="text-sm">(a sua palavra-passe tem de ter no mínimo 6 caracteres)</p>
                        <button onClick={handleSignUp} disabled={loading}
                            className="w-full p-2 text-white bg-blue-500 rounded-md">
                            {loading ? "Aguarde..." : "Criar conta"}
                        </button>
                        <button onClick={() => authModal.onOpen("sign_in")} disabled={loading}
                            className="w-full p-2 text-white bg-gray-500 rounded-md mt-2">
                            {loading ? "Aguarde..." : "Já tenho uma conta"}
                        </button>
                        <button onClick={resendMail} disabled={loading || resendCooldown > 0}
                            className="w-full p-2 text-white bg-gray-500 rounded-md mt-2">
                            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : loading ? "Aguarde..." : "Reenviar email de confirmação"}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <input type="email" placeholder="Introduza o seu email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-2 border rounded-md" />
                        <input type="password" placeholder="" value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-2 border rounded-md" />
                        <button onClick={handleLogin} disabled={loading}
                            className="w-full p-2 text-white bg-blue-500 rounded-md">
                            {loading ? "Aguarde..." : "Entrar"}
                        </button>
                        <button onClick={() => authModal.onOpen("sign_up")} disabled={loading}
                            className="w-full p-2 text-white bg-gray-500 rounded-md mt-2">
                            {loading ? "Aguarde..." : "Criar uma conta"}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;