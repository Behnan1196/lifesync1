"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
    const { session, loading: authLoading } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && session) {
            router.push("/app");
        }
    }, [session, authLoading, router]);

    useEffect(() => {
        const lastEmail = localStorage.getItem("lifesync.last_email");
        if (lastEmail) {
            setEmail(lastEmail);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            localStorage.setItem("lifesync.last_email", email);
            router.push("/app");
        }
    };

    if (authLoading) return null;

    return (
        <div className={styles.container}>
            <div className={`${styles.card} glass`}>
                <div className={styles.header}>
                    <h1>LifeSync</h1>
                    <div className={styles.langSelector}>
                        <button
                            onClick={() => setLanguage('tr')}
                            className={language === 'tr' ? styles.activeLang : ''}
                        >
                            TR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={language === 'en' ? styles.activeLang : ''}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>{t.auth.email}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>{t.auth.password}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? t.common.loading : t.auth.loginButton}
                    </button>
                </form>
            </div>
        </div>
    );
}
