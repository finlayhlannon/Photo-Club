"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const completeUserProfile = useMutation(api.users.completeUserProfile);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);

          let firstName = "";
          let lastName = "";
          let name = "";
          let email = "";
          if (flow === "signUp") {
            firstName = formData.get("firstName") as string;
            lastName = formData.get("lastName") as string;
            name = `${firstName} ${lastName}`.trim();
            email = formData.get("email") as string;
            formData.set("name", name);
          }

          try {
            await signIn("password", formData);

            // After successful sign up, reload and then complete the user profile
            if (flow === "signUp") {
              setTimeout(async () => {
                await completeUserProfile({
                  firstName,
                  lastName,
                  name,
                  email,
                });
                window.location.reload();
              }, 500);
            }
          } catch (error: any) {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else if (error.message.includes("already exists")) {
              toastTitle = "Account already exists. Please sign in.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
            return;
          }
          setSubmitting(false);
        }}
      >
        {flow === "signUp" && (
          <>
            <input
              className="auth-input-field"
              type="text"
              name="firstName"
              placeholder="First Name"
              required
            />
            <input
              className="auth-input-field"
              type="text"
              name="lastName"
              placeholder="Last Name"
              required
            />
          </>
        )}
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
