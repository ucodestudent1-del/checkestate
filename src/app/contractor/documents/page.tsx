"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Upload, Loader2, Download, Trash2, AlertCircle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const documentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Valid URL is required"),
  documentType: z.string().min(1, "Document type is required"),
  expiresAt: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

type Document = {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  expiresAt: string | null;
  uploadedAt: string;
};

const DOCUMENT_TYPES = [
  "Insurance Certificate",
  "License",
  "Certification",
  "W-9 Form",
  "Contract",
  "Other",
];

export default function ContractorDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      fileName: "",
      fileUrl: "",
      documentType: "",
      expiresAt: "",
    },
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contractor/documents");
      const json = await res.json();
      if (res.ok) {
        setDocuments(json.data || []);
      }
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onSubmit = async (data: DocumentFormData) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/contractor/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Upload failed");
        return;
      }

      toast.success("Document uploaded successfully");
      reset();
      setShowUploadModal(false);
      fetchDocuments();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/contractor/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete document");
        return;
      }

      toast.success("Document deleted");
      fetchDocuments();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600">Manage your contractor documents and certifications</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No documents uploaded</h3>
            <p className="mt-2 text-slate-500">Upload your first document to get started</p>
            <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Document</th>
                    <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Type</th>
                    <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Expires</th>
                    <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Uploaded</th>
                    <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const expired = isExpired(doc.expiresAt);
                    const expiringSoon = isExpiringSoon(doc.expiresAt);
                    let statusBadge = (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="inline h-3 w-3 mr-1" /> Valid
                      </span>
                    );
                    if (expired) {
                      statusBadge = (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="inline h-3 w-3 mr-1" /> Expired
                        </span>
                      );
                    } else if (expiringSoon) {
                      statusBadge = (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertCircle className="inline h-3 w-3 mr-1" /> Expiring Soon
                        </span>
                      );
                    }

                    return (
                      <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-900">{doc.fileName}</p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{doc.fileUrl}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-slate-600">{doc.documentType}</td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">{formatDate(doc.expiresAt)}</span>
                            {statusBadge}
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-slate-500">{formatDate(doc.uploadedAt)}</td>
                        <td className="text-right py-3 pr-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              View
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input id="fileName" {...register("fileName")} placeholder="e.g., insurance_certificate.pdf" />
                {errors.fileName && <p className="mt-1 text-sm text-red-600">{errors.fileName.message}</p>}
              </div>
              <div>
                <Label htmlFor="fileUrl">File URL</Label>
                <Input id="fileUrl" {...register("fileUrl")} placeholder="https://example.com/document.pdf" />
                {errors.fileUrl && <p className="mt-1 text-sm text-red-600">{errors.fileUrl.message}</p>}
              </div>
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select onValueChange={(v) => register("documentType").onChange({ target: { value: v } })} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentType && <p className="mt-1 text-sm text-red-600">{errors.documentType.message}</p>}
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input id="expiresAt" type="date" {...register("expiresAt")} />
                {errors.expiresAt && <p className="mt-1 text-sm text-red-600">{errors.expiresAt.message}</p>}
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}