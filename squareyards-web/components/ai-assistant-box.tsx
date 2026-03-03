"use client";

import { useState } from "react";

import styles from "./ai-assistant-box.module.css";

export function AIAssistantBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: { source: "homepage", module: "advisor-widget" },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to get answer");
      }
      setAnswer(data.answer || "No response received.");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Unable to get answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.box} card`}>
      <p className={styles.title}>Ask Property Advisor</p>
      <form onSubmit={handleAsk} className={styles.form}>
        <textarea
          rows={4}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Example: Is a 3BHK in Gurgaon better for rental yield or appreciation?"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </form>
      {answer && <p className={styles.answer}>{answer}</p>}
    </div>
  );
}
