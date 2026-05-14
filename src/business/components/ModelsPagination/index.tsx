"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/shared/components/Pagination/pagination";
import { useRouter, useSearchParams } from "next/navigation";

type ModelsPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageOfLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  onPageChange?: (page: number) => void;
};

function buildPageWindow(current: number, total: number): number[] {
  const start = Math.max(1, current - 1);
  const end = Math.min(total, current + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

function ModelsPagination({
  currentPage,
  totalPages,
  pageOfLabel,
  previousPageLabel,
  nextPageLabel,
  onPageChange,
}: ModelsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange =
    onPageChange ??
    ((nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage === 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    });

  if (totalPages <= 1) {
    return null;
  }

  const pageWindow = buildPageWindow(currentPage, totalPages);
  const showStartEllipsis = pageWindow[0] > 2;
  const showEndEllipsis = pageWindow[pageWindow.length - 1] < totalPages - 1;
  const showFirstPage = pageWindow[0] > 1;
  const showLastPage = pageWindow[pageWindow.length - 1] < totalPages;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:justify-between">
      <p className="text-muted-foreground shrink-0 text-sm">{pageOfLabel}</p>

      <Pagination className="sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-label={previousPageLabel}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) handlePageChange(currentPage - 1);
              }}
              href="#"
            >
              {previousPageLabel}
            </PaginationPrevious>
          </PaginationItem>

          {showFirstPage && (
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(1);
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}

          {showStartEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {pageWindow.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showEndEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {showLastPage && (
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(totalPages);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              aria-label={nextPageLabel}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) handlePageChange(currentPage + 1);
              }}
              href="#"
            >
              {nextPageLabel}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default ModelsPagination;
