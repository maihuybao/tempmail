"use server";

import { parseEmailContent } from "@/hooks/parseEmail";
import { pool } from "@/lib/db";

export async function searchEmails(recipientQuery: string) {
  try {
    const result = await pool.query(
      `SELECT id, date, sender, recipients, data
       FROM mail
       WHERE recipients = $1
       ORDER BY id DESC`,
      [`<${recipientQuery}>`]
    );
    const output = [];
    for (const i of result.rows) {
      const parsedMail = await parseEmailContent(i.data);
      output.push({
        id: i.id as number,
        sender: i.sender,
        date: i.date,
        recipients: i.recipients,
        data: parsedMail,
      });
    }
    return output;
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Failed to search emails");
  }
}

export async function deleteUserEmail(id: number, recipients: string) {
  try {
    await pool.query(
      "DELETE FROM mail WHERE id = $1 AND recipients = $2",
      [id, recipients]
    );
    return { ok: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { ok: false, error: "Failed to delete email" };
  }
}
