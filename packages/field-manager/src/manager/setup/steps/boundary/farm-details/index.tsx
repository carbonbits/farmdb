import { TENURE_OPTIONS } from "@farmdb/field-manager/manager/setup/_config";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { SelectField, TextField } from "@farmdb/ui";

/**
 * The farm's name, place and tenure. They stay a draft on this screen, because
 * the API has no farm record to save them to yet.
 */
export function FarmDetails() {
  const draft = useFarmSetup((state) => state.draft);
  const updateDraft = useFarmSetup((state) => state.updateDraft);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1.7fr_1fr]">
        <TextField
          label="Farm name"
          placeholder="e.g. Kilimo Ridge"
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
        <TextField
          label="County"
          placeholder="e.g. Nakuru"
          value={draft.county}
          onChange={(event) => updateDraft({ county: event.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Ward / locality"
          placeholder="e.g. Mauche"
          value={draft.ward}
          onChange={(event) => updateDraft({ ward: event.target.value })}
        />
        <SelectField
          label="Tenure"
          options={TENURE_OPTIONS}
          placeholder="Choose…"
          value={draft.tenure}
          onChange={(event) => updateDraft({ tenure: event.target.value })}
        />
      </div>
    </div>
  );
}
