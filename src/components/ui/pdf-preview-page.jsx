import { useRef } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export const FileUpload = ({
  onFileUpload,
  onClear,
  isProcessing,
  pdfLibLoaded,
  error,
  file,
  screenshots,
  className,
}) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const hasScreenshots = screenshots.length > 0;

  return (
    <Card className={cn('group relative overflow-hidden bg-gray-100 p-8 shadow-lg', className)}>
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-yellow-400/20 transition-transform group-hover:scale-110" />
      <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-yellow-400/20 transition-transform group-hover:scale-110" />

      <div
        className={cn(
          'relative flex flex-col',
          hasScreenshots ? 'items-start gap-8 md:flex-row' : 'items-center',
        )}
      >
        <div
          className={cn(
            'flex flex-col items-center space-y-8 py-5',
            hasScreenshots ? 'w-full md:w-1/2' : 'w-full max-w-xl',
          )}
        >
          <div
            onClick={handleUploadClick}
            className="group/upload relative mb-6 w-full max-w-xl cursor-pointer rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md"
          >
            <div className="absolute inset-0 rounded-xl border-2 border-dashed border-gray-200 transition-colors group-hover/upload:border-yellow-400" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={onFileUpload}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 rotate-12 items-center justify-center rounded-2xl bg-yellow-400 shadow-lg transition-all duration-300 group-hover/upload:rotate-0">
                  <svg className="h-10 w-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black shadow-lg transition-transform group-hover/upload:scale-110">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {!pdfLibLoaded ? 'Initializing...' : 'Drop your PDF here'}
                </h3>
                <p className="text-gray-600">
                  {!pdfLibLoaded ? 'Setting up PDF processor...' : 'or click to browse from your computer'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleUploadClick}
              disabled={!pdfLibLoaded || isProcessing}
              className="min-w-[160px] border-black bg-black text-white hover:bg-gray-900 hover:text-white disabled:bg-gray-400 disabled:text-white"
              size="lg"
            >
              {!pdfLibLoaded ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : (
                'Select File'
              )}
            </Button>

            {screenshots.length > 0 && (
              <Button
                onClick={onClear}
                variant="outline"
                size="lg"
                className="min-w-[160px] border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              >
                Clear All
              </Button>
            )}
          </div>

          {file && (
            <div className="hidden w-full items-center justify-center md:flex">
              <div className="flex w-full max-w-md items-center gap-5 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-yellow-400/20 text-yellow-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 3.75h6.379a2.25 2.25 0 011.591.659l4.121 4.121a2.25 2.25 0 01.659 1.591V18a2.25 2.25 0 01-2.25 2.25h-10.5A2.25 2.25 0 015 18V6a2.25 2.25 0 012.25-2.25z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900" title={file.name}>
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="inline-block h-1 w-1 rounded-full bg-gray-400" />
                    <span>
                      {screenshots.length} {screenshots.length === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
              <p className="mt-4 font-medium text-white">Processing PDF pages...</p>
            </div>
          </div>
        )}

        {hasScreenshots && (
          <div className="w-full pr-1 md:w-1/2">
            <div className="grid max-h-[500px] grid-cols-1 gap-4 overflow-auto">
              {screenshots.map((shot) => (
                <div
                  key={shot.id}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-gray-200 bg-white/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Page {shot.pageNumber}
                  </span>
                  <img src={shot.dataUrl} alt={`Page ${shot.pageNumber}`} className="h-auto w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6 border-2 border-red-300 bg-red-50/80 backdrop-blur-sm">
          {error}
        </Alert>
      )}
    </Card>
  );
};
