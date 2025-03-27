"use client";

import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
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

    // Function to check if email exists
    const checkIfEmailExists = async (email: string) => {
        const { data, error } = await supabase.rpc("check_email_exists", { email_input: email });

        if (error) {
            console.error("Error checking email:", error);
            toast.error("Erro ao verificar o email. Tente novamente.");
            return false;
        }

        return data; // Returns true if the email exists, false otherwise
    };

    // Handle sign up
    const handleSignUp = async () => {
        setLoading(true);

        // Check if email already exists
        const emailExists = await checkIfEmailExists(email);
        if (emailExists) {
            toast.error("Este email já está registrado. Tente outro.");
            setLoading(false);
            return;
        }

        try {
            // Step 1: Insert user into the users table first

            // Step 2: If the users table insert succeeds, create the auth user
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
            title={authModal.mode === "sign_up" ? "Criar Conta" : "Entrar"}
            description={
                authModal.mode === "sign_up"
                    ? "Introduza os seus dados para criar uma conta! 🚀"
                    : "Introduza os seus dados para iniciar sessão. Caso não tenha uma conta, crie uma! 👋🏿"
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
                    </>
                ) : (
                    <Auth
                        providers={["github"]}
                        theme="dark"
                        supabaseClient={supabase}
                        view={authModal.mode}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: "Email",
                                    password_label: "Palavra-passe",
                                    button_label: "Entrar",
                                    social_provider_text: "Entrar com {{provider}}",
                                },
                            },
                        }}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: "#404040",
                                        brandAccent: "#FF0000",
                                    },
                                },
                            },
                        }}
                    />
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;