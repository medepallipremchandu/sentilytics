import React from 'react'

export default function AdminTable({ columns, rows, emptyText = 'No records found.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full min-w-[540px] text-left text-sm">
        <thead className="bg-slate-900/90 text-slate-300">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-slate-400" colSpan={columns.length}>{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="border-t border-slate-800">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 align-top text-slate-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
