import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Company } from "./types";

const SkeletonRow: React.FC<{ columns: ColumnDef<Company, any>[] }> = ({ columns }) => (
  <tr className="animate-pulse">
    {columns.map((_, idx) => (
      <td key={idx} className="p-3 border-b bg-gray-200 h-6">&nbsp;</td>
    ))}
  </tr>
);

const App: React.FC = () => {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showEndMessage, setShowEndMessage] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
          const res = await fetch("/data/mockCompanies.json");
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType?.includes("application/json")) {
            throw new Error("Failed to fetch company data");
          }
        const data: Company[] = await res.json();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setAllCompanies(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const loadPage = useCallback(() => {
    if (!allCompanies.length || !hasMore) return;
  
    const pageSize = 10;
    const end = Math.min(page * pageSize, allCompanies.length);
  
    setCompanies(allCompanies.slice(0, end));
  
    setHasMore(end < allCompanies.length);
  
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
    
  }, [page, allCompanies, hasMore]);
    
  useEffect(() => {
    if (allCompanies.length) loadPage();
  }, [page, loadPage, allCompanies]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
  
    if (!loading && hasMore === false) {
      setShowEndMessage(true);
  
      timer = setTimeout(() => {
        setShowEndMessage(false);
      }, 3000);
    }
  
    return () => clearTimeout(timer); 
  }, [loading, hasMore]);
  
  const lastRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const columns = useMemo<ColumnDef<Company, any>[]>(
    () => [
      { header: "ID", accessorFn: (_row, i) => i + 1 },
      { header: "Name", accessorFn: (row) => row.owner, enableSorting: true },
      { header: "Company", accessorFn: (row) => row.company, enableSorting: true },
      { header: "Location", accessorFn: (row) => row.city, enableSorting: true },
      { header: "Email", accessorFn: (row) => row.email },
    ],
    []
  );

  const filteredData = useMemo(() => {
    const filterText = globalFilter.toLowerCase();
    return companies.filter((c) => {
      const matchesSearch =
        c.owner.toLowerCase().includes(filterText) ||
        c.company.toLowerCase().includes(filterText);
      const matchesCity = locationFilter ? c.city === locationFilter : true;
      const matchesCompany = companyFilter ? c.company === companyFilter : true;
      return matchesSearch && matchesCity && matchesCompany;
    });
  }, [companies, globalFilter, locationFilter, companyFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { sorting: [{ id: "id", desc: false }] },
  });

  const locations = useMemo(() => [...new Set(allCompanies.map((c) => c.city))], [allCompanies]);
  const companyNames = useMemo(() => [...new Set(allCompanies.map((c) => c.company))], [allCompanies]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Company Directory</h1>


      <div className="flex flex-wrap gap-4 mb-4 justify-end items-center">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by Owner or Company..."
            className="border p-2 rounded w-full pr-8"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          <option value="">All Cities</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          <option value="">All Companies</option>
          {companyNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border rounded shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`p-3 text-left cursor-pointer select-none ${
                        isSortable ? "hover:bg-gray-200" : ""
                      }`}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center justify-between">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && (
                          <span className="ml-2 flex flex-col items-center">
                            <span
                              className={`text-xs leading-none ${
                                sortDirection === "asc" ? "text-gray-800" : "text-gray-300"
                              }`}
                            >
                              ▲
                            </span>
                            <span
                              className={`text-xs leading-none ${
                                sortDirection === "desc" ? "text-gray-800" : "text-gray-300"
                              }`}
                            >
                              ▼
                            </span>
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {filteredData.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-center">
                  No companies found.
                </td>
              </tr>
            )}

            {table.getRowModel().rows.map((row, idx) => {
              const ref = idx === table.getRowModel().rows.length - 1 ? lastRowRef : null;
              return (
                <tr
                  key={row.id}
                  ref={ref}
                  className="even:bg-gray-50 hover:bg-gray-100 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 border-b border-gray-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}

            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))}
          </tbody>
        </table>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center">{error}</div>}

      {!loading && showEndMessage && !error && (
        <p className="text-center mt-4 text-gray-500">No more companies to load.</p>
      )}
    </div>
  );
};

export default App;
