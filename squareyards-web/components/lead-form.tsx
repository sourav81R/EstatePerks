"use client";

import { useState } from "react";

import styles from "./lead-form.module.css";

type LeadFormProps = {
  propertyId: string;
  propertyName: string;
};

export function LeadForm({ propertyId, propertyName }: LeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          name,
          email,
          phone,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit lead.");
      }

      setStatus(data.message || "Request submitted.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to submit lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`${styles.formWrap} card`}>
      <p className={styles.title}>Interested in {propertyName}?</p>
      <p className={styles.sub}>Get callback from local property advisor</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          type="email"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Any specific requirement?"
          rows={3}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Get Callback"}
        </button>
      </form>

      {status && <p className={styles.status}>{status}</p>}
    </aside>
  );
}
