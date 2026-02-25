import { useEffect, useState } from "react";
import { getStorageRepo } from "../../repos";

type StorageImageInlineProps = {
  path: string;
  alt?: string;
  size?: number;
  className?: string;
};

export function StorageImageInline({
  path,
  alt = "",
  size = 36,
  className,
}: StorageImageInlineProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const downloadUrl = await getStorageRepo().getDownloadUrl(path);
        if (active) setUrl(downloadUrl);
      } catch {
        if (active) setUrl(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [path]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={alt}
      className={className ?? "size-full shrink-0 object-cover"}
      style={{ width: size, height: size }}
    />
  );
}
