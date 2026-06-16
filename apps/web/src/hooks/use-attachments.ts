"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/services/firebase/config";
import { useAuth } from "./use-auth";

export function useAttachments(noteId: string) {
  return useQuery({
    queryKey: ["attachments", noteId],
    queryFn: async () => {
      const q = query(
        collection(db, "attachments"),
        where("note_id", "==", noteId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    enabled: !!noteId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      noteId,
      file,
    }: {
      noteId: string;
      file: File;
    }) => {
      const path = `attachments/${noteId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "attachments"), {
        note_id: noteId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: path,
        url,
        uploaded_by: user?.uid || "",
        created_at: Timestamp.now(),
      });

      return url;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", variables.noteId],
      });
    },
  });
}
