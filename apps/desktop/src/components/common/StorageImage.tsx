import { useEffect, useState } from "react";
import { getStorageRepo } from "../../repos";
import { cn } from "@/lib/utils";

export type StorageImageProps = {
  path?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

export const StorageImage = ({
  path,
  alt = "",
  size = 40,
  className,
}: StorageImageProps) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    if (!path) {
      setDownloadUrl(null);
      return;
    }

    void (async () => {
      try {
        const url = await getStorageRepo().getDownloadUrl(path);
        if (isActive) {
          setDownloadUrl(url);
        }
      } catch (error) {
        console.error("Failed to load storage image", error);
        if (isActive) {
          setDownloadUrl(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [path]);

  if (!path) {
    return null;
  }

  return (
    <img
      src={downloadUrl ?? undefined}
      alt={alt}
      style={{ width: size, height: size }}
      className={cn("shrink-0 object-cover bg-muted", className)}
    />
  );
};
