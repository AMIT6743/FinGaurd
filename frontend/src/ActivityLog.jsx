import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import { PlusCircle, Trash2, Edit2, AlertCircle, Clock, RefreshCw } from "lucide-react";

export default function ActivityLog({ role, setPage }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Requirements: ensure the page checks the user's role from my AuthContext; 
    // if the role is 'VIEWER', redirect to the main dashboard.
    if (role === "viewer") {
      setPage("dashboard");
      return;
    }

    apiFetch("/admin/audit-logs")
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [role, setPage]);

  // Prevent render flicker while redirecting
  if (role === "viewer") return null;

  const renderChanges = (action, oldValues, newValues) => {
    if (action === "CREATE") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontSize: 13, fontWeight: 500 }}>
          <PlusCircle size={14} /> New record created
        </div>
      );
    }
    
    if (action === "DELETE") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 13, fontWeight: 500 }}>
          <Trash2 size={14} /> Record removed
        </div>
      );
    }
    
    if (action === "UPDATE") {
      if (!oldValues || !newValues) return <span style={{ color: "#6b7280" }}>Unknown changes</span>;
      
      const changes = [];
      const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      
      keys.forEach((key) => {
        // Exclude system stamps that always change automatically
        if (key === 'createdAt' || key === 'updatedAt' || key === 'id' || key === 'userId' || key === 'recordId') return;
        
        if (oldValues[key] !== newValues[key]) {
          changes.push(
            <div key={key} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: "#4b5563", textTransform: "capitalize", minWidth: 60 }}>{key}:</span>
              <span style={{ color: "#ef4444", textDecoration: "line-through", padding: "2px 6px", background: "#fef2f2", borderRadius: 4 }}>
                {String(oldValues[key] || "null")}
              </span>
              <span style={{ color: "#9ca3af" }}>→</span>
              <span style={{ color: "#10b981", fontWeight: 500, padding: "2px 6px", background: "#ecfdf5", borderRadius: 4 }}>
                {String(newValues[key] || "null")}
              </span>
            </div>
          );
        }
      });
      
      if (changes.length === 0) return <span style={{ color: "#6b7280", fontSize: 13 }}>No fields changed</span>;
      return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{changes}</div>;
    }
    
    return <span style={{ color: "#6b7280" }}>{action}</span>;
  };

  const renderSummary = (action, oldValues, newValues) => {
    if (action === "CREATE") {
      const typeStr = newValues?.type === 'expense' ? 'expense' : 'income';
      return `Added ${typeStr} of $${newValues?.amount || 0} (${newValues?.category || 'Unknown'})`;
    }
    if (action === "DELETE") {
      return `Removed record of $${oldValues?.amount || 0} (${oldValues?.category || 'Unknown'})`;
    }
    if (action === "UPDATE") {
      const parts = [];
      if (oldValues?.amount !== newValues?.amount && oldValues?.amount !== undefined) {
        const diff = Number(newValues?.amount || 0) - Number(oldValues?.amount || 0);
        if (diff !== 0) {
          parts.push(`${diff > 0 ? 'Increased' : 'Decreased'} amount by $${Math.abs(diff)}`);
        }
      }
      if (oldValues?.category !== newValues?.category && newValues?.category) {
        parts.push(`set category to ${newValues.category}`);
      }
      if (oldValues?.type !== newValues?.type && newValues?.type) {
        parts.push(`switched type to ${newValues.type}`);
      }
      if (oldValues?.note !== newValues?.note) {
        parts.push(`updated notes`);
      }
      if (oldValues?.date !== newValues?.date) {
        parts.push(`changed date to ${newValues?.date}`);
      }
      if (parts.length > 0) return parts.join(", ");
      return "Made minor edits";
    }
    return "Unknown event";
  };

  const fmtPreciseDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Timestamp", "User", "Action", "Summary", "Details"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    padding: "14px 22px",
                    borderBottom: "0.5px solid #e5e7eb",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <RefreshCw size={24} />
                    <div>Loading audit trails...</div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <AlertCircle size={24} color="#ef4444" />
                    <div>Error: {error}</div>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: i < logs.length - 1 ? "0.5px solid #f3f4f6" : "none",
                    background: "#fff",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={{ padding: "18px 22px", fontSize: 13, color: "#6b7280", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} color="#9ca3af" />
                      {fmtPreciseDate(log.createdAt)}
                    </div>
                  </td>
                  <td style={{ padding: "18px 22px", fontSize: 13, fontWeight: 500, color: "#1f2937", verticalAlign: "top" }}>
                    {log.userEmail}
                  </td>
                  <td style={{ padding: "18px 22px", verticalAlign: "top" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: log.action === "UPDATE" ? "#eff6ff" : log.action === "DELETE" ? "#fef2f2" : "#ecfdf5",
                        color: log.action === "UPDATE" ? "#1d4ed8" : log.action === "DELETE" ? "#b91c1c" : "#047857",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.5
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "18px 22px", verticalAlign: "top", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    {renderSummary(log.action, log.oldValues, log.newValues)}
                  </td>
                  <td style={{ padding: "18px 22px", verticalAlign: "top" }}>
                    {renderChanges(log.action, log.oldValues, log.newValues)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
