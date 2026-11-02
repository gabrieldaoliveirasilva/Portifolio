"use client";

type PageActionsProps = {
  clearDisabled?: boolean;
  onClear?: () => void;
  onRefresh: () => void;
  refreshDisabled?: boolean;
};

export default function PageActions({
  clearDisabled = false,
  onClear,
  onRefresh,
  refreshDisabled = false
}: PageActionsProps) {
  return (
    <div className="page-actions" aria-label="Acoes da pagina">
      <button className="button page-action-refresh" disabled={refreshDisabled} onClick={onRefresh} type="button">
        Atualizar
      </button>
      {onClear && (
        <button className="button dark page-action-clear" disabled={clearDisabled} onClick={onClear} type="button">
          Limpar
        </button>
      )}
    </div>
  );
}
