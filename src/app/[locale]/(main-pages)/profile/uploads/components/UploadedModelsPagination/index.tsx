"use client";

import ModelsPagination from "@/src/business/components/ModelsPagination";
import { UPLOADS_PAGE_SIZE } from "@/src/business/constants/profileConfig";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

type UploadedModelsPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

function UploadedModelsPagination({
  currentPage,
  totalPages,
  totalCount,
}: UploadedModelsPaginationProps) {
  const t = useTranslations("Profile.uploads.list");
  const router = useRouter();
  const searchParams = useSearchParams();

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <ModelsPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      pageSize={UPLOADS_PAGE_SIZE}
      formatPageOf={(from, to, total) => t("pageOf", { from, to, total })}
      previousPageLabel={t("previousPage")}
      nextPageLabel={t("nextPage")}
      onPageChange={setPage}
    />
  );
}

export default UploadedModelsPagination;
