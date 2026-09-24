import React from "react";
import { statusInfo } from "../lib/coan";

export const StatusBadge = ({ status }) => {
  const info = statusInfo[status] || {
    label: status || "—",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${info.className}`}
    >
      {info.label}
    </span>
  );
};

export default StatusBadge;
