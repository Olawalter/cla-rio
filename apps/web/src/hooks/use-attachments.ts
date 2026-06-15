"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";

const supabase = createSupabaseClient();
const BUCKET = "attachments";

export function useAttachments(noteId: string) {
  return useQuery({
    queryKey: ["attachments", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      file,
      uploadedBy,
    }: {
      noteId: string;
      file: File;
      uploadedBy: string;
    }) => {
      const filePath = `${noteId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("attachments")
        .insert({
          note_id: noteId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      return data;
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", noteId] });
    },
  });
}

export function useAttachmentUrl(filePath: string | undefined) {
  return useQuery({
    queryKey: ["attachment-url", filePath],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000,
  });
}
