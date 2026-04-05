import { useRef } from 'react';
import { FilePlus2, FileText, LoaderCircle, Plus, Upload } from 'lucide-react';

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
  const hasScreenshots = screenshots.length > 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-white/10 bg-zinc-950/80 p-8 shadow-2xl shadow-black/25 backdrop-blur-md',
        className,
      )}
    >
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/3 rounded-full bg-yellow-400/15 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-red-500/15 blur-2xl" />

      <div
        className={cn(
          'relative flex flex-col gap-8',
          hasScreenshots ? 'items-start md:flex-row' : 'items-center',
        )}
      >
        <div
          className={cn(
            'flex flex-col items-center space-y-8 py-2',
            hasScreenshots ? 'w-full md:w-1/2' : 'w-full max-w-3xl',
          )}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group/upload relative w-full max-w-3xl cursor-pointer rounded-[28px] border border-white/10 bg-zinc-900/80 p-8 shadow-xl transition-all hover:-translate-y-1 hover:border-yellow-400/40 hover:shadow-yellow-500/10"
          >
            <div className="absolute inset-3 rounded-[20px] border-2 border-dashed border-white/10 transition-colors group-hover/upload:border-yellow-400/60" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={onFileUpload}
              className="hidden"
            />

            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="flex h-20 w-20 rotate-6 items-center justify-center rounded-[24px] bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 transition-all duration-300 group-hover/upload:rotate-0">
                  <Upload className="h-10 w-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform group-hover/upload:scale-110">
                  <Plus className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-white">
                  {!pdfLibLoaded ? 'Initializing preview engine...' : 'Drop your PDF here'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {!pdfLibLoaded
                    ? 'Preparing in-browser PDF rendering...'
                    : 'or click to browse from your computer'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!pdfLibLoaded || isProcessing}
              className="min-w-[160px] bg-white text-black hover:bg-zinc-100"
              size="lg"
            >
              {!pdfLibLoaded ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin text-yellow-500" />
                  <span>Loading...</span>
                </span>
              ) : (
                'Select File'
              )}
            </Button>

            {hasScreenshots && (
              <Button
                onClick={onClear}
                variant="outline"
                size="lg"
                className="min-w-[160px] border-white/20 bg-zinc-900/80 text-white hover:bg-zinc-800"
              >
                Clear All
              </Button>
            )}
          </div>

          {file && (
            <div className="hidden w-full justify-center md:flex">
              <div className="flex w-full max-w-md items-center gap-5 rounded-2xl border border-white/10 bg-black/35 px-6 py-5 shadow-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white" title={file.name}>
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="inline-block h-1 w-1 rounded-full bg-zinc-500" />
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
          <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-yellow-400" />
              <p className="mt-4 font-medium text-white">Processing PDF pages...</p>
            </div>
          </div>
        )}

        {hasScreenshots && (
          <div className="w-full md:w-1/2">
            <div className="max-h-[500px] space-y-4 overflow-auto pr-1">
              {screenshots.map((shot) => (
                <div
                  key={shot.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm"
                >
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-900 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Page {shot.pageNumber}
                  </span>
                  <img src={shot.dataUrl} alt={`Page ${shot.pageNumber}`} className="block h-auto w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="mt-6 border border-red-500/30 bg-red-500/10 text-red-100"
        >
          {error}
        </Alert>
      )}

      {!hasScreenshots && !file && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
          <FilePlus2 className="h-3.5 w-3.5" />
          Preview pages before you use a tool
        </div>
      )}
    </Card>
  );
};
