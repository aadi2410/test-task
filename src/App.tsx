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
import LocationSelect from "./ui/custom-select";
import SearchInput from "./ui/custom-serach";
import { FiAlertCircle } from "react-icons/fi";

const SkeletonRow: React.FC<{ columns: ColumnDef<Company, any>[] }> = ({ columns }) => (
  <tr className="animate-pulse">
    {columns.map((_, idx) => (
      <td
        key={idx}
        className="p-3 border-b border-gray-200"
      >
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
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
    <div>
      <h1 className="text-3xl bg-blue-900 text-white py-2.5 font-semibold text-center mb-6 sticky top-0 z-50">Company Directory</h1>
      <div className="max-w-7xl mx-auto w-full px-4 pb-4">
        <div className="flex md:flex-row flex-col flex-wrap gap-4 mb-4 md:justify-between md:items-center">
          <div className="flex gap-2 items-center w-full sm:w-[unset]">
            <LocationSelect
              locations={locations}
              value={locationFilter}
              onChange={setLocationFilter}
              optionPlaceholder="All Location"
            />
            <LocationSelect
              locations={companyNames}
              value={companyFilter}
              onChange={setCompanyFilter}
              optionPlaceholder="All Companies"
            />
          </div>
         <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
          />
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded shadow-sm max-h-[calc(100vh-160px)] min-h-[125px] overflow-auto">
          <table className="divide-y w-full divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={`p-3 text-left font-semibold cursor-pointer select-none ${
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
                    <p className="h-[250px] flex justify-center items-center gap-3 text-gray-400">
                      <FiAlertCircle size={24} />
                      No companies found</p>
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
                      <td key={cell.id} className="p-3 border-b border-gray-200 text-gray-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {loading &&
                Array.from({ length: 10 }).map((_, i) => (
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
    </div>
  );
};

export default App;
