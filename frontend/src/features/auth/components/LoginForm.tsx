import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LockIcon, MailIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage, getErrorStatus } from "@/lib/api";

import { useLogin } from "../hooks/useAuth";
import { ResendVerification } from "./ResendVerification";
import { SocialAuth } from "./SocialAuth";
import { validateEmail, validateRequired } from "../validation";

export function LoginForm({
  defaultEmail,
}: {
  defaultEmail?: string | undefined;
}) {
  const { mutate, isPending, error, variables } = useLogin();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const next = {
      email: validateEmail(email),
      password: validateRequired(password, "Şifre"),
    };
    setErrors(next);
    if (next.email || next.password) return;
    mutate({ email, password });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@email.com"
        icon={<MailIcon />}
        defaultValue={defaultEmail}
        error={errors.email}
      />
      <TextField
        label="Şifre"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Şifreniz"
        icon={<LockIcon />}
        error={errors.password}
      />
      <div className="-mt-2 flex justify-end">
        <Link
          to="/forgot-password"
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          Şifremi Unuttum ?
        </Link>
      </div>
      {error && (
        <Alert variant="error">
          {getErrorMessage(
            error,
            "Giriş başarısız. Bilgilerinizi kontrol edin.",
          )}
        </Alert>
      )}
      {getErrorStatus(error) === 403 && variables && (
        <ResendVerification email={variables.email} />
      )}
      <Button type="submit" loading={isPending}>
        {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
      <SocialAuth label="Google ile devam et" />
    </form>
  );
}
