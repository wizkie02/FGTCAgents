'use client';

import { useState } from 'react';

export const useUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(prev => prev >= 100 ? 100 : prev + 10);
        }, 100);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setUploadedFileContent(data.content);
        setUploadedFileName(file.name);

        clearInterval(interval);
        setUploadProgress(100);

        setTimeout(() => {
          setUploadProgress(0);
          setSelectedFile(null);
        }, 1000);

        return { fileName: file.name };

      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadProgress(0);
        setSelectedFile(null);
        return null;
      }
    }
  };

  return {
    selectedFile,
    uploadProgress,
    uploadedFileContent,
    uploadedFileName,
    handleFileChange
  };
};
