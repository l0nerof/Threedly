import DownloadModelButton from "@/src/business/components/DownloadModelButton";
import ModelFileList from "@/src/business/components/ModelFileList";
import { fetchPublicModelFiles } from "@/src/business/utils/supabase/modelFiles";
import { getTranslations } from "next-intl/server";

type FilesTabProps = {
  modelId: string;
  locale: string;
};

async function FilesTab({ modelId, locale }: FilesTabProps) {
  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: "ModelPage.tabs" }),
    fetchPublicModelFiles(modelId),
  ]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-muted-foreground text-sm">
        {t("filesAndFormatsDescription")}
      </p>
      {!result.ok ? (
        <p role="alert" className="text-destructive text-sm">
          {t("filesError")}
        </p>
      ) : result.files.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("filesEmpty")}</p>
      ) : (
        <ModelFileList
          files={result.files}
          locale={locale}
          primaryLabel={t("filesPrimary")}
          getKey={(file) => file.id}
          renderAction={(file) => (
            <DownloadModelButton
              modelId={modelId}
              fileId={file.id}
              fileName={file.file_name}
              className="shrink-0"
              compact
            />
          )}
        />
      )}
    </div>
  );
}

export default FilesTab;
