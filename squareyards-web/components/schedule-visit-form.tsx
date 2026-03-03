"use client";

import { useMemo, useState } from "react";

import styles from "./schedule-visit-form.module.css";

type ScheduleVisitFormProps = {
  propertyId: string;
  propertyName: string;
};

function getMinDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ScheduleVisitForm({ propertyId, propertyName }: ScheduleVisitFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState(getMinDate());
  const [timeSlot, setTimeSlot] = useState("Morning");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const minDate = useMemo(() => getMinDate(), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          name,
          phone,
          email,
          preferredDate,
          timeSlot,
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit visit request.");
      }
      setStatus(data.message || "Visit request submitted.");
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setTimeSlot("Morning");
      setPreferredDate(minDate);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to submit visit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`${styles.formWrap} card`}>
      <p className={styles.title}>Schedule Site Visit</p>
      <p className={styles.sub}>Book a guided tour for {propertyName}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email (optional)"
          type="email"
        />
        <label>
          Preferred date
          <input
            type="date"
            value={preferredDate}
            min={minDate}
            onChange={(event) => setPreferredDate(event.target.value)}
          />
        </label>
        <label>
          Time slot
          <select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)}>
            <option value="Morning">Morning (9 AM - 12 PM)</option>
            <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
            <option value="Evening">Evening (4 PM - 7 PM)</option>
          </select>
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes for advisor (optional)"
          rows={2}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Book Visit"}
        </button>
      </form>

      {status && <p className={styles.status}>{status}</p>}
    </aside>
  );
}
