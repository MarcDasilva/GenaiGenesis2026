"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import GlassSurface from "@/components/GlassSurface";
import { supabase } from "@/lib/supabase";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";

const BUCKET = "pdfs";

function sanitizeUserPath(email: string): string {
  return email.replace(/@/g, "_at_").replace(/\./g, "_");
}

type FileEntry = {
  name: string;
  path: string;
  created_at?: string;
};

type ProjectsPanelProps = {
  open: boolean;
};

function PaperPreview({ title }: { title: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 140 }}>
      <div
        className="absolute inset-0 rounded-t-md bg-white"
        style={{
          boxShadow:
            "0 -4px 12px rgba(0,0,0,0.08), 2px 0 8px rgba(0,0,0,0.04), -2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Dog-ear fold */}
        <div
          className="absolute right-0 top-0 size-5"
          style={{
            background: "linear-gradient(225deg, #e5e5e5 50%, #f5f5f5 50%)",
            boxShadow: "-1px 1px 2px rgba(0,0,0,0.08)",
          }}
        />
        {/* Title on the paper */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-[11px] font-bold leading-snug text-black/80 line-clamp-3">
            {title}
          </p>
        </div>
        {/* Faux body lines */}
        <div className="flex flex-col gap-1.5 px-3">
          <div className="h-1 w-[90%] rounded-full bg-black/8" />
          <div className="h-1 w-[70%] rounded-full bg-black/6" />
          <div className="h-1 w-[80%] rounded-full bg-black/5" />
          <div className="h-1 w-[55%] rounded-full bg-black/4" />
          <div className="h-1 w-[75%] rounded-full bg-black/4" />
          <div className="h-1 w-[60%] rounded-full bg-black/3" />
        </div>
      </div>
    </div>
  );
}

export function ProjectsPanel({ open }: ProjectsPanelProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const userPath = userEmail ? sanitizeUserPath(userEmail) : null;

  const fetchFiles = useCallback(async () => {
    if (!userPath || !open) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(userPath, { limit: 100 });
      if (listError) throw listError;
      const entries: FileEntry[] = (data ?? [])
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f) => ({
          name: f.name,
          path: `${userPath}/${f.name}`,
          created_at: f.created_at ?? undefined,
        }));
      setFiles(entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to list files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [userPath, open]);

  useEffect(() => {
    if (open && userPath) fetchFiles();
  }, [open, userPath, fetchFiles]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userPath) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are allowed.");
        return;
      }
      e.target.value = "";
      setUploading(true);
      setError(null);
      try {
        const path = `${userPath}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        await fetchFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [userPath, fetchFiles],
  );

  const handleView = useCallback(async (file: FileEntry) => {
    try {
      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.path, 3600);
      if (urlError) throw urlError;
      if (data?.signedUrl) {
        setViewingPdf({ url: data.signedUrl, name: file.name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open file");
    }
  }, []);

  const handleDelete = useCallback(
    async (path: string) => {
      try {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET)
          .remove([path]);
        if (deleteError) throw deleteError;
        await fetchFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [fetchFiles],
  );

  if (!open) return null;

  if (viewingPdf) {
    return (
      <div className="flex flex-1 min-h-0 flex-col px-6 py-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewingPdf(null)}
            className="rounded-full p-1.5 text-black/60 hover:bg-black/10 hover:text-black/90"
            aria-label="Close viewer"
          >
            <IconX className="size-5" />
          </button>
          <span className="truncate text-sm font-medium text-black/80">
            {viewingPdf.name.replace(/\.pdf$/i, "")}
          </span>
        </div>
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden">
          <GlassSurface
            width={"100%" as unknown as number}
            height={"100%" as unknown as number}
            borderRadius={16}
            className="overflow-hidden h-full"
            contentClassName="!p-0 !m-0"
          >
            <iframe
              src={viewingPdf.url}
              className="h-full w-full border-0"
              title={viewingPdf.name}
            />
          </GlassSurface>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-col -mt-2 pb-6 overflow-y-auto"
      style={{ paddingLeft: "10%", paddingRight: "10%" }}
    >
      {error && <p className="mb-4 text-sm text-red-600/90">{error}</p>}
      {!userEmail ? (
        <p className="text-sm text-black/60">
          Sign in to upload and view PDFs.
        </p>
      ) : loading ? (
        <p className="text-sm text-black/50">Loading files…</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {/* Upload card */}
          <label className="cursor-pointer">
            <GlassSurface
              width={"100%" as unknown as number}
              height={220}
              borderRadius={16}
              className="overflow-hidden h-full"
              contentClassName="!p-0 !m-0"
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-black/50 hover:text-black/80 transition-colors">
                <IconPlus className="size-10 stroke-[1.5]" />
                <span className="text-xs font-medium">
                  {uploading ? "Uploading…" : ""}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </div>
            </GlassSurface>
          </label>

          {/* File cards */}
          {files.map((f) => (
            <div key={f.path} className="relative group">
              <GlassSurface
                width={"100%" as unknown as number}
                height={220}
                borderRadius={16}
                className="overflow-hidden h-full"
                contentClassName="!p-0 !m-0"
              >
                <button
                  type="button"
                  onClick={() => handleView(f)}
                  className="flex h-full w-full flex-col justify-end"
                >
                  <PaperPreview title={f.name.replace(/\.pdf$/i, "")} />
                </button>
              </GlassSurface>
              <button
                type="button"
                onClick={() => handleDelete(f.path)}
                className="absolute right-3 top-3 rounded-md p-1.5 text-black/30 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-600"
                aria-label={`Delete ${f.name}`}
              >
                <IconTrash className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
