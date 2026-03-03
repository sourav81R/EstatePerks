"use client";

import { useState } from "react";

import styles from "./newsletter-form.module.css";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus("Please enter your email.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Subscription failed.");
      }

      setStatus(data.message || "Subscribed successfully.");
      setEmail("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubscribe}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : "Subscribe"}
      </button>
      {status && <p className={styles.message}>{status}</p>}
    </form>
  );
}
