import { useFields } from "@farmdb/field-manager/manager/_data/fetchers/use-fields";
import { useFieldsManager } from "@farmdb/field-manager/manager/_store";
import { FieldCard } from "@farmdb/field-manager/manager/list/cards-mode/field-card";
import type { Field } from "@farmdb/field-manager/types";
import { formatHectares } from "@farmdb/field-manager/utils/area";
import type { ReactNode } from "react";

/**
 * Shows every field as a card under a sticky header that holds the view switch
 * and a count of fields and mapped area.
 */
export function FieldsCards({ viewSwitch }: { viewSwitch: ReactNode }) {
  const { data: fields, error, isLoading } = useFields();

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#f8f2e5] px-4 pb-[26px]">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-[#f8f2e5] pt-4 pb-3.5">
        {viewSwitch}
        {fields && fields.length > 0 && (
          <p className="text-[12.5px] text-[#75583f]">{summarise(fields)}</p>
        )}
      </header>
      <FieldsCardsBody fields={fields} hasError={Boolean(error)} isLoading={isLoading} />
    </div>
  );
}

function FieldsCardsBody({
  fields,
  hasError,
  isLoading,
}: {
  fields: Field[] | undefined;
  hasError: boolean;
  isLoading: boolean;
}) {
  const selectedFieldId = useFieldsManager((state) => state.selectedFieldId);
  const selectField = useFieldsManager((state) => state.selectField);

  if (isLoading) return <CardsMessage text="Loading fields…" />;
  if (hasError) return <CardsMessage text="Couldn't load your fields. Try again shortly." />;
  if (!fields || fields.length === 0) {
    return <CardsMessage text="No fields yet. Draw one on the map to start." />;
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-3">
      {fields.map((field) => (
        <li key={field.id}>
          <FieldCard
            field={field}
            isSelected={field.id === selectedFieldId}
            onSelect={() => selectField(field.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function summarise(fields: Field[]): string {
  const mappedArea = fields.reduce((total, field) => total + (field.area_ha ?? 0), 0);
  const fieldWord = fields.length === 1 ? "field" : "fields";
  return `${fields.length} ${fieldWord} · ${formatHectares(mappedArea)} mapped`;
}

function CardsMessage({ text }: { text: string }) {
  return (
    <p className="text-[13px] text-[#75583f]" role="status">
      {text}
    </p>
  );
}
