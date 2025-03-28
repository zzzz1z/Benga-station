"use client";

import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import useAuthModal from "@/hooks/useAuthModal";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AuthModal = () => {

    const supabase = useSupabaseClient();
    const router = useRouter();
    const { session } = useSessionContext();
    const authModal = useAuthModal();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    
    // Function to check if email exists in users table
    const checkIfEmailExists = async (email: string) => {
        const { data, error } = await supabase
            .from("users")
            .select("email") 
            .ilike("email", email) // ✅ Fix: Case-insensitive search
            .maybeSingle();

        console.log(data)
        console.log("🔍 Checking email:", email);
        console.log("🔍 Query result:", data, error);
    
        if (error) {
            console.error("❌ Error checking email:", error);
            toast.error("Erro ao verificar o email. Tente novamente.");
            return false;
        }
        return !!data; // Returns true if a row is found
    };
    
    

    // Handle sign-up
    const handleSignUp = async () => {
        setLoading(true);
    
        try {
            // ✅ Ensure checkIfEmailExists completes before proceeding
            const emailExists = await checkIfEmailExists(email);
            if (emailExists) {
                toast.error("Este email já está registrado. Use outro.");
                setLoading(false);
                return;
            }

            console.log(emailExists)
    
            // ✅ Sign up only if email does not exist
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });
    
            if (signUpError) {
                toast.error("Erro ao criar conta. Tente novamente.");
                setLoading(false);
                return;
            }
    
            toast.success("Conta criada com sucesso! Verifique seu email.");
            authModal.onClose();
        } catch (error) {
            console.error("Erro no signup:", error);
            toast.error("Ocorreu um erro. Tente novamente.");
        }
    
        setLoading(false);
    };
    
    // Handle login
    const handleLogin = async () => {
        setLoading(true);

        try {
            // Attempt login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                toast.error("Por favor verifique o seu email para poder inicar sessão.");
                setLoading(false);
                return;
            }

            toast.success("Login bem-sucedido!");
            authModal.onClose();
            router.refresh();
        } catch (error) {
            toast.error("Ocorreu um erro. Tente novamente.");
            console.error(error);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (session) {
            router.refresh();
            authModal.onClose();
        }
    }, [session]);

    const onChange = (open: boolean) => {
        if (!open) {
            authModal.onClose();
        }
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
                    <>
                        <input
                            type="email"
                            placeholder="Introduza o seu email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />

                        <input
                            type="password"
                            placeholder="Introduza a sua palavra passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />

                        <button
                            onClick={handleSignUp}
                            disabled={loading}
                            className="w-full p-2 text-white bg-blue-500 rounded-md"
                        >
                            {loading ? "Aguarde..." : "Criar conta"}
                        </button>

                        <button
                            onClick={() => authModal.onOpen("sign_in")}
                            disabled={loading}
                            className="w-full p-2 text-white bg-gray-500 rounded-md mt-2"
                        >
                            {loading ? "Aguarde..." : "Já tenho uma conta"}
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            type="email"
                            placeholder="Introduza o seu email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />

                        <input
                            type="password"
                            placeholder="Introduza a sua palavra passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full p-2 text-white bg-blue-500 rounded-md"
                        >
                            {loading ? "Aguarde..." : "Entrar"}
                        </button>

                        <button
                            onClick={() => authModal.onOpen("sign_up")}
                            disabled={loading}
                            className="w-full p-2 text-white bg-gray-500 rounded-md mt-2"
                        >
                            {loading ? "Aguarde..." : "Criar uma conta"}
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;
