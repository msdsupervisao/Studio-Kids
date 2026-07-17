export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        role="status"
        aria-label="Carregando"
      />
    </div>
  );
}
